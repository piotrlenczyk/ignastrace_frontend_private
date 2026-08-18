import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEV_COUNTRY_COOKIE_NAME } from '@/constants/countries';

const PAYMENTS_API = 'https://payments.ignastrace.test/api/payments/v1';

/*
 * The request scope the reader reads its market out of: the development country
 * cookie the application honours, and the edge country header behind it. Both
 * live here because the whole point of the header the reader states is that
 * those two agree.
 */
let cookieJar = new Map<string, string>();
let ambientHeaders = new Headers();

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieJar.get(name);

      return value === undefined ? undefined : { name, value };
    },
    getAll: () => [...cookieJar].map(([name, value]) => ({ name, value })),
  }),
  headers: async () => ambientHeaders,
}));

vi.stubEnv('PAYMENTS_API_BASE_URL', PAYMENTS_API);

/*
 * Every currency the application knows, so the market a test picks is decided by
 * the test rather than by whichever currency wave the environment is on.
 */
vi.stubEnv('NEXT_PUBLIC_CURRENCY_VERSION', '3');

/*
 * The network, substituted once for the whole file: the generated client
 * captures `globalThis.fetch` when it is created, so a stub installed later
 * would never be the one it calls. Each test swaps what the payments service
 * answers with instead of swapping the function.
 */
const upstreamRequests: Request[] = [];
let respond: (request: Request) => Promise<Response> = async () => {
  throw new Error('No upstream response was set up for this test.');
};

vi.stubGlobal('fetch', async (request: Request) => {
  upstreamRequests.push(request);

  return respond(request);
});

/*
 * Imported after the environment and the network are in place, and dynamically:
 * a static import is hoisted above the stubs, so the client would be built
 * around the real `fetch` and the real service's base URL. The header name is
 * pulled the same way for the same reason.
 */
const { getTrialPricing } = await import('./pricing');
const { CALLER_COUNTRY_HEADER } = await import('@/network/payments-api/payments-api-server-client');

type PriceOverrides = {
  currency: string;
  amount?: number;
  trialAmount?: number;
  trialDays?: number;
  provider?: string;
};

const price = ({ currency, amount = 5900, trialAmount = 195, trialDays = 7, provider = 'stripe' }: PriceOverrides) => ({
  id: `price-${currency}-${provider}`,
  currency,
  amount,
  trialAmount,
  finalTrialAmount: trialAmount + 1000,
  trialDays,
  duration: 4,
  durationUnits: 'weeks',
  provider,
  isDefault: true,
  providerAccount: {},
});

type ProductOverrides = {
  planName?: string | null;
  priority?: number;
  prices?: ReturnType<typeof price>[];
};

const product = ({
  planName = 'FOUR_WEEKS_TRIAL',
  priority = 1,
  prices = [price({ currency: 'USD' })],
}: ProductOverrides = {}) => ({
  id: `product-${planName}-${priority}`,
  sku: 'four_weeks_trial',
  campaign: 'default',
  priority,
  prices,
  ...(planName === null ? {} : { metadata: { planName } }),
});

const catalogue = (products: unknown[]) => {
  respond = async () =>
    new Response(JSON.stringify(products), { status: 200, headers: { 'content-type': 'application/json' } });
};

const refusal = (status = 503) => {
  respond = async () =>
    new Response(JSON.stringify({ message: 'Service Unavailable', statusCode: status }), {
      status,
      headers: { 'content-type': 'application/json' },
    });
};

beforeEach(() => {
  cookieJar = new Map();
  ambientHeaders = new Headers({ 'cf-ipcountry': 'US' });
  upstreamRequests.length = 0;
});

describe('getTrialPricing', () => {
  it('quotes the four-week trial product, ignoring the other plans in the payload', async () => {
    catalogue([
      product({ planName: 'ANNUAL', prices: [price({ currency: 'USD', amount: 100, trialAmount: 1 })] }),
      product({ planName: 'FOUR_WEEKS_TRIAL', prices: [price({ currency: 'USD', amount: 5900, trialAmount: 195 })] }),
    ]);

    await expect(getTrialPricing()).resolves.toEqual({
      trialAmount: 195,
      fullAmount: 5900,
      currency: 'USD',
      trialDays: 7,
    });
  });

  it('ignores a product whose plan name is missing or not a string rather than crashing the read', async () => {
    catalogue([
      product({ planName: null }),
      { ...product({ planName: null }), metadata: { planName: 42 } },
      product({ planName: 'FOUR_WEEKS_TRIAL', prices: [price({ currency: 'USD', amount: 4900 })] }),
    ]);

    await expect(getTrialPricing()).resolves.toMatchObject({ fullAmount: 4900 });
  });

  it('resolves several matching products by priority, lowest first', async () => {
    catalogue([
      product({ priority: 9, prices: [price({ currency: 'USD', amount: 9900 })] }),
      product({ priority: 2, prices: [price({ currency: 'USD', amount: 2900 })] }),
      product({ priority: 5, prices: [price({ currency: 'USD', amount: 5900 })] }),
    ]);

    await expect(getTrialPricing()).resolves.toMatchObject({ fullAmount: 2900 });
  });

  const markets: [string, string, number][] = [
    ['RO', 'RON', 29900],
    ['SG', 'SGD', 7900],
    ['GB', 'GBP', 4900],
  ];

  it.each(markets)('quotes a visitor in %s in %s', async (country, currency, amount) => {
    ambientHeaders = new Headers({ 'cf-ipcountry': country });
    catalogue([
      product({
        prices: [price({ currency: 'USD', amount: 5900 }), price({ currency, amount })],
      }),
    ]);

    await expect(getTrialPricing()).resolves.toMatchObject({ currency, fullAmount: amount });
  });

  it('falls back to US dollars when the market currency is not published', async () => {
    ambientHeaders = new Headers({ 'cf-ipcountry': 'PL' });
    catalogue([
      product({ prices: [price({ currency: 'EUR', amount: 4900 }), price({ currency: 'USD', amount: 5900 })] }),
    ]);

    await expect(getTrialPricing()).resolves.toMatchObject({ currency: 'USD', fullAmount: 5900 });
  });

  it('takes the last row where two share a currency, as the reference implementation does', async () => {
    catalogue([
      product({
        prices: [
          price({ currency: 'USD', amount: 5900, provider: 'stripe' }),
          price({ currency: 'USD', amount: 6900, provider: 'paypal' }),
        ],
      }),
    ]);

    await expect(getTrialPricing()).resolves.toMatchObject({ fullAmount: 6900 });
  });

  it('reads the trial charge and the recurring amount off the one price row, in minor units', async () => {
    catalogue([product({ prices: [price({ currency: 'USD', amount: 5900, trialAmount: 195, trialDays: 1 })] })]);

    await expect(getTrialPricing()).resolves.toEqual({
      trialAmount: 195,
      fullAmount: 5900,
      currency: 'USD',
      trialDays: 1,
    });
  });

  it('takes the trial length from the selected price row rather than from another market', async () => {
    ambientHeaders = new Headers({ 'cf-ipcountry': 'RO' });
    catalogue([
      product({
        prices: [price({ currency: 'USD', trialDays: 7 }), price({ currency: 'RON', trialDays: 1 })],
      }),
    ]);

    await expect(getTrialPricing()).resolves.toMatchObject({ trialDays: 1 });
  });

  it('tells the payments service which market the application resolved', async () => {
    ambientHeaders = new Headers({ 'cf-ipcountry': 'SG' });
    catalogue([product({ prices: [price({ currency: 'SGD' })] })]);

    await getTrialPricing();

    expect(upstreamRequests.at(-1)?.headers.get(CALLER_COUNTRY_HEADER)).toBe('SG');
    expect(upstreamRequests.at(-1)?.url).toBe(`${PAYMENTS_API}/products`);
  });

  it('tells the payments service the market the development cookie overrides to', async () => {
    ambientHeaders = new Headers({ 'cf-ipcountry': 'US' });
    cookieJar.set(DEV_COUNTRY_COOKIE_NAME, 'RO');
    catalogue([product({ prices: [price({ currency: 'USD' }), price({ currency: 'RON', amount: 29900 })] })]);

    await expect(getTrialPricing()).resolves.toMatchObject({ currency: 'RON', fullAmount: 29900 });
    expect(upstreamRequests.at(-1)?.headers.get(CALLER_COUNTRY_HEADER)).toBe('RO');
  });

  it('throws when the catalogue carries no four-week trial product', async () => {
    catalogue([product({ planName: 'ANNUAL' })]);

    await expect(getTrialPricing()).rejects.toThrow(/FOUR_WEEKS_TRIAL/);
  });

  it('throws when the product is priced in neither the market currency nor US dollars', async () => {
    ambientHeaders = new Headers({ 'cf-ipcountry': 'RO' });
    catalogue([product({ prices: [price({ currency: 'EUR' })] })]);

    await expect(getTrialPricing()).rejects.toThrow(/RON/);
  });

  it('throws when the payments service refuses', async () => {
    refusal();

    await expect(getTrialPricing()).rejects.toThrow();
  });
});
