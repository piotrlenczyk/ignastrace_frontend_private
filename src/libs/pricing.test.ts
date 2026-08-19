import { describe, expect, it } from 'vitest';

import type { FunnelPlan } from '@/actions/funnel-plan';
import type { paymentsSchemas } from '@/network/payments-api/payments-api-server-client';
import type { Pricing } from '@/types/pricing.types';

import {
  getAmountDue,
  getCheckoutProduct,
  getCurrencyProducts,
  getInitialCurrency,
  getMemberCurrency,
  getPlanProductName,
  getPricingProduct,
  transformProductsFromPaymentsApi,
  transformUserProductsFromPaymentsApi,
} from './pricing';

/*
 * The specification types both bags the payments service publishes opaquely — a
 * provider account's public configuration and a product's metadata are
 * `Record<string, never>` — so a fixture shaped like the real payload states its
 * keys through one cast here rather than in every case.
 */
const opaque = <T>(bag: T) => bag as unknown as Record<string, never>;

const providerAccount = (publicKey: string): paymentsSchemas['ProviderAccountResponseDto'] => ({
  id: 'acct-uuid',
  provider: 'stripe',
  providerId: 'acct_stripe_1',
  name: 'Ignastrace',
  countryCode: 'US',
  configuration: opaque({ publicKey }),
});

const price = ({
  currency,
  amount,
  trialAmount,
  trialDays = 7,
  publicKey = 'pk_test_catalogue',
}: {
  currency: string;
  amount: number;
  trialAmount: number;
  trialDays?: number;
  publicKey?: string;
}): paymentsSchemas['GetPriceResponseDto'] => ({
  id: `price-${currency.toLowerCase()}`,
  currency,
  amount,
  trialAmount,
  // The upsell-inclusive amount is deliberately far from the trial charge, so a
  // case that reached for it would read wrong rather than merely fail.
  finalTrialAmount: trialAmount + 4000,
  trialDays,
  duration: 4,
  durationUnits: 'weeks',
  provider: 'stripe',
  isDefault: true,
  providerAccount: providerAccount(publicKey),
});

const product = ({
  planName,
  prices,
  priority = 1,
  sku = 'four_weeks_trial',
}: {
  planName?: string;
  prices: paymentsSchemas['GetPriceResponseDto'][];
  priority?: number;
  sku?: string;
}): paymentsSchemas['GetProductWithAllPricesResponseDto'] => ({
  id: `product-${sku}`,
  sku,
  prices,
  campaign: 'default',
  priority,
  metadata: planName ? opaque({ planName }) : undefined,
});

const trialProduct = product({
  planName: 'FOUR_WEEKS_TRIAL',
  prices: [
    price({ currency: 'USD', amount: 5900, trialAmount: 195 }),
    price({ currency: 'EUR', amount: 5400, trialAmount: 175 }),
  ],
});

describe('transformProductsFromPaymentsApi', () => {
  it('publishes the currencies the catalogue prices the product in, and nothing else', () => {
    const pricing = transformProductsFromPaymentsApi([trialProduct]);

    expect(pricing.supportedCurrencies).toEqual(['USD', 'EUR']);
  });

  it('keys a product on the plan its metadata names', () => {
    const pricing = transformProductsFromPaymentsApi([trialProduct]);

    expect(pricing.products.map((item) => item.name)).toEqual(['FOUR_WEEKS_TRIAL']);
  });

  it('drops a product whose metadata names no plan this application knows', () => {
    const pricing = transformProductsFromPaymentsApi([
      product({ prices: [price({ currency: 'USD', amount: 5900, trialAmount: 195 })], sku: 'annual_1' }),
      trialProduct,
    ]);

    expect(pricing.products.map((item) => item.sku)).toEqual(['four_weeks_trial']);
  });

  it('publishes the currencies of a product it quotes, not of one it discards', () => {
    const pricing = transformProductsFromPaymentsApi([
      product({ prices: [price({ currency: 'PLN', amount: 24900, trialAmount: 900 })], sku: 'annual_1' }),
      trialProduct,
    ]);

    expect(pricing.supportedCurrencies).toEqual(['USD', 'EUR']);
  });

  it("normalizes the provider account's public key onto every price row", () => {
    const pricing = transformProductsFromPaymentsApi([trialProduct]);
    const prices = Object.values(pricing.products[0]!.prices);

    expect(prices.map((row) => row.providerAccount.clientKey)).toEqual(['pk_test_catalogue', 'pk_test_catalogue']);
  });

  it("orders the products by the catalogue's own priority, lowest first", () => {
    const pricing = transformProductsFromPaymentsApi([
      product({
        planName: 'FOUR_WEEKS',
        prices: [price({ currency: 'USD', amount: 5900, trialAmount: 0, trialDays: 0 })],
        priority: 2,
        sku: 'four_weeks',
      }),
      product({
        planName: 'FOUR_WEEKS_TRIAL',
        prices: [price({ currency: 'USD', amount: 5900, trialAmount: 195 })],
        priority: 1,
      }),
    ]);

    expect(pricing.products.map((item) => item.sku)).toEqual(['four_weeks_trial', 'four_weeks']);
  });
});

describe('transformUserProductsFromPaymentsApi', () => {
  it('resolves a member response with one price per product to the guest catalogue shape', () => {
    const memberPrice = price({ currency: 'EUR', amount: 5400, trialAmount: 0, trialDays: 0 });
    const member = transformUserProductsFromPaymentsApi([
      {
        id: 'product-four_weeks_trial',
        sku: 'four_weeks_trial',
        price: memberPrice,
        campaign: 'default',
        priority: 1,
        metadata: opaque({ planName: 'FOUR_WEEKS_TRIAL' }),
      },
    ]);
    const guest = transformProductsFromPaymentsApi([product({ planName: 'FOUR_WEEKS_TRIAL', prices: [memberPrice] })]);

    expect(member).toEqual(guest);
  });

  it('publishes only the currency the payments service resolved for the member', () => {
    const member = transformUserProductsFromPaymentsApi([
      {
        id: 'product-four_weeks_trial',
        sku: 'four_weeks_trial',
        price: price({ currency: 'GBP', amount: 4900, trialAmount: 150 }),
        campaign: 'default',
        priority: 1,
        metadata: opaque({ planName: 'FOUR_WEEKS_TRIAL' }),
      },
    ]);

    expect(member.supportedCurrencies).toEqual(['GBP']);
  });
});

describe('getInitialCurrency', () => {
  it("keeps the market's currency when the catalogue publishes a price in it", () => {
    expect(getInitialCurrency({ supportedCurrencies: ['USD', 'EUR'], marketCurrency: 'EUR' })).toBe('EUR');
  });

  it("replaces the market's currency with US dollars when the catalogue does not publish it", () => {
    expect(getInitialCurrency({ supportedCurrencies: ['USD', 'EUR'], marketCurrency: 'PLN' })).toBe('USD');
  });

  it('matches the published currencies whichever case the market currency arrives in', () => {
    expect(getInitialCurrency({ supportedCurrencies: ['USD', 'EUR'], marketCurrency: 'eur' })).toBe('EUR');
  });

  it('falls back to US dollars for a catalogue that publishes nothing', () => {
    expect(getInitialCurrency({ supportedCurrencies: [], marketCurrency: 'EUR' })).toBe('USD');
  });
});

describe('getMemberCurrency', () => {
  it("keeps the currency the member's previous subscription was billed in", () => {
    expect(getMemberCurrency({ supportedCurrencies: ['USD', 'EUR'], previousCurrency: 'EUR' })).toBe('EUR');
  });

  it('matches that currency whichever case the legacy subscription publishes it in', () => {
    expect(getMemberCurrency({ supportedCurrencies: ['USD', 'EUR'], previousCurrency: 'eur' })).toBe('EUR');
  });

  it('falls back to US dollars when the catalogue no longer sells in that currency', () => {
    expect(getMemberCurrency({ supportedCurrencies: ['USD', 'EUR'], previousCurrency: 'PLN' })).toBe('USD');
  });

  it('takes the currency the payments service resolved when it offers neither', () => {
    expect(getMemberCurrency({ supportedCurrencies: ['GBP'], previousCurrency: 'PLN' })).toBe('GBP');
  });

  it('falls back to US dollars for a catalogue that publishes nothing', () => {
    expect(getMemberCurrency({ supportedCurrencies: [], previousCurrency: 'PLN' })).toBe('USD');
  });
});

describe('getCheckoutProduct', () => {
  it('quotes the four-week trial product, in the currency asked for', () => {
    const pricing = transformProductsFromPaymentsApi([trialProduct]);

    const quoted = getCheckoutProduct({ pricing, currency: 'EUR' });

    expect(quoted.name).toBe('FOUR_WEEKS_TRIAL');
    expect(quoted.price.currency).toBe('EUR');
  });

  it('quotes the four-week product when the catalogue publishes no trial', () => {
    const pricing = transformProductsFromPaymentsApi([
      product({
        planName: 'FOUR_WEEKS',
        prices: [price({ currency: 'USD', amount: 5900, trialAmount: 0, trialDays: 0 })],
        sku: 'four_weeks',
      }),
    ]);

    expect(getCheckoutProduct({ pricing, currency: 'USD' }).name).toBe('FOUR_WEEKS');
  });

  it('carries the trial length of the row it quotes, so the copy follows the price', () => {
    const pricing = transformProductsFromPaymentsApi([
      product({
        planName: 'FOUR_WEEKS_TRIAL',
        prices: [
          price({ currency: 'USD', amount: 5900, trialAmount: 195, trialDays: 7 }),
          price({ currency: 'EUR', amount: 5400, trialAmount: 175, trialDays: 1 }),
        ],
      }),
    ]);

    expect(getCheckoutProduct({ pricing, currency: 'EUR' }).price.trialDays).toBe(1);
  });

  it('falls back to the US dollar row when the catalogue does not price the currency asked for', () => {
    const pricing = transformProductsFromPaymentsApi([trialProduct]);

    expect(getCheckoutProduct({ pricing, currency: 'PLN' }).price.currency).toBe('USD');
  });

  it('fails, naming the condition, for a catalogue with no four-week product', () => {
    const pricing = transformProductsFromPaymentsApi([
      product({ prices: [price({ currency: 'USD', amount: 5900, trialAmount: 195 })], sku: 'annual_1' }),
    ]);

    expect(() => getCheckoutProduct({ pricing, currency: 'USD' })).toThrow(/pricing plan/i);
  });

  it('fails, naming the condition, when the product is priced in neither the currency nor US dollars', () => {
    const pricing = transformProductsFromPaymentsApi([
      product({ planName: 'FOUR_WEEKS_TRIAL', prices: [price({ currency: 'EUR', amount: 5400, trialAmount: 175 })] }),
    ]);

    expect(() => getCheckoutProduct({ pricing, currency: 'PLN' })).toThrow(/PLN/);
  });
});

describe('getAmountDue', () => {
  const row = price({ currency: 'USD', amount: 5900, trialAmount: 195 });
  const quoted = getCheckoutProduct({
    pricing: transformProductsFromPaymentsApi([product({ planName: 'FOUR_WEEKS_TRIAL', prices: [row] })]),
    currency: 'USD',
  }).price;

  it("charges the trial amount of the same row for the funnel's trial plan", () => {
    expect(getAmountDue({ plan: 'trial', price: quoted })).toBe(195);
  });

  it("charges the full four-week amount of the same row for the funnel's subscription plan", () => {
    expect(getAmountDue({ plan: 'subscription', price: quoted })).toBe(5900);
  });

  it('never quotes the upsell-inclusive final trial amount', () => {
    expect(getAmountDue({ plan: 'trial', price: quoted })).not.toBe(quoted.finalTrialAmount);
  });
});

describe('the funnel plan choosing a catalogue product', () => {
  /*
   * The composition the checkout screen makes: fold the catalogue into one
   * currency, then pick the product the funnel's plan names. Asserted through
   * the reader's public surface, because that composition is the rule — a
   * change to either half moves what someone is charged.
   */
  const quote = ({ pricing, currency, plan }: { pricing: Pricing; currency: string; plan: FunnelPlan }) =>
    getPricingProduct({
      plan: getPlanProductName(plan),
      currencyProducts: getCurrencyProducts({ products: pricing.products, currency }),
    });

  const catalogue = transformProductsFromPaymentsApi([
    trialProduct,
    product({
      planName: 'FOUR_WEEKS',
      prices: [
        price({ currency: 'USD', amount: 5900, trialAmount: 0, trialDays: 0 }),
        price({ currency: 'EUR', amount: 5400, trialAmount: 0, trialDays: 0 }),
      ],
      priority: 2,
      sku: 'four_weeks',
    }),
  ]);

  it('quotes the non-trial four-week product for the outright-subscription plan', () => {
    expect(quote({ pricing: catalogue, currency: 'USD', plan: 'subscription' }).name).toBe('FOUR_WEEKS');
  });

  it('quotes the four-week trial product for the trial plan', () => {
    expect(quote({ pricing: catalogue, currency: 'USD', plan: 'trial' }).name).toBe('FOUR_WEEKS_TRIAL');
  });

  it('falls back to the default product rather than throwing when the catalogue publishes no match', () => {
    const trialOnly = transformProductsFromPaymentsApi([trialProduct]);

    expect(quote({ pricing: trialOnly, currency: 'USD', plan: 'subscription' }).name).toBe('FOUR_WEEKS_TRIAL');
  });

  it('charges the trial amount of the trial product it resolved', () => {
    expect(quote({ pricing: catalogue, currency: 'USD', plan: 'trial' }).price.finalAmount).toBe(195);
  });

  it('charges the full four-week amount of the non-trial product it resolved', () => {
    expect(quote({ pricing: catalogue, currency: 'USD', plan: 'subscription' }).price.finalAmount).toBe(5900);
  });

  it('quotes that product in the currency asked for', () => {
    expect(quote({ pricing: catalogue, currency: 'EUR', plan: 'subscription' }).price.currency).toBe('EUR');
  });
});

describe('getPricingProduct', () => {
  it('fails, naming the condition, when the product it picked is priced in neither the currency nor US dollars', () => {
    const pricing = transformProductsFromPaymentsApi([
      product({ planName: 'FOUR_WEEKS_TRIAL', prices: [price({ currency: 'EUR', amount: 5400, trialAmount: 175 })] }),
    ]);

    expect(() =>
      getPricingProduct({
        plan: 'FOUR_WEEKS_TRIAL',
        currencyProducts: getCurrencyProducts({ products: pricing.products, currency: 'PLN' }),
      }),
    ).toThrow(/Cannot find a FOUR_WEEKS_TRIAL price/);
  });
});
