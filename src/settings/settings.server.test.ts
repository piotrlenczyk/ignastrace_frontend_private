import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEV_COUNTRY_COOKIE_NAME } from '@/constants/countries';

import { SETTINGS_OVERRIDE_COOKIES } from './settings.cookies';

/*
 * The request scope Next puts around a server component, and nothing more: the
 * cookies the browser sent and the headers the edge added.
 */
let cookieJar = new Map<string, string>();
let ambientHeaders = new Headers();

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieJar.get(name);

      return value === undefined ? undefined : { name, value };
    },
  }),
  headers: async () => ambientHeaders,
}));

/*
 * The network, substituted once for the whole file: the generated client
 * captures `globalThis.fetch` when its module first runs, so a stub installed
 * later would never be the one it calls.
 */
let respond: (request: Request) => Promise<Response> = async () =>
  new Response(JSON.stringify({}), { status: 200, headers: { 'content-type': 'application/json' } });

/*
 * Normalised to a `Request` whatever the caller passed, so an assertion can read
 * the URL off it either way: the flags are fetched by URL and init, where the
 * generated client hands `fetch` a `Request` it built itself.
 */
vi.stubGlobal('fetch', async (input: Request | string, init?: RequestInit) =>
  respond(input instanceof Request ? input : new Request(input, init)),
);

/*
 * Imported after the request scope and the network are in place, so the module
 * under test never runs against the ambient ones.
 */
const { _readServerSettings } = await import('./settings.server');

/** What `/features` answers with. */
const features = (body: Record<string, boolean>, status = 200) => {
  respond = async () => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
};

/** What `/features` does when it is down: no JSON, nothing to parse. */
const featuresUnreachable = () => {
  respond = async () => {
    throw new TypeError('fetch failed');
  };
};

beforeEach(() => {
  cookieJar = new Map();
  ambientHeaders = new Headers();
  features({});
  /*
   * Every variable the reader consults, stubbed per test rather than once for the
   * file: `unstubAllEnvs` below would otherwise leave the later tests reading the
   * developer's own `.env`, which vitest loads.
   */
  vi.stubEnv('INTERNAL_API_URL', 'https://legacy.ignastrace.test/api/v1');
  vi.stubEnv('FEATURE_UPSELLS', '');
  vi.stubEnv('FEATURE_REQUEST_ZIP', '');
  vi.stubEnv('FEATURE_ADYEN_GPAY', '');
  vi.stubEnv('FEATURE_EXPRESS_CHECKOUT_AUTO', '');
  vi.stubEnv('FEATURE_TEST_WIDGET', '');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('the country a request is asking from', () => {
  it('is the one Cloudflare reports', async () => {
    ambientHeaders.set('cf-ipcountry', 'GB');

    expect((await _readServerSettings()).countryCode).toBe('GB');
  });

  it('is the development cookie ahead of what Cloudflare reports', async () => {
    ambientHeaders.set('cf-ipcountry', 'GB');
    cookieJar.set(DEV_COUNTRY_COOKIE_NAME, 'DE');

    expect((await _readServerSettings()).countryCode).toBe('DE');
  });

  it('falls back when Cloudflare reports nothing', async () => {
    expect((await _readServerSettings()).countryCode).toBe('US');
  });

  it('falls back when Cloudflare cannot place the address', async () => {
    ambientHeaders.set('cf-ipcountry', 'XX');

    expect((await _readServerSettings()).countryCode).toBe('US');
  });
});

describe('the flags the API owns', () => {
  it('arrive under the names this application uses for them', async () => {
    features({ ENABLE_REVERSE_LOOKUP: true, ENABLE_SMS_CONSENT: true });

    const settings = await _readServerSettings();

    expect(settings.reverseLookupEnabled).toBe(true);
    expect(settings.smsConsentEnabled).toBe(true);
  });

  it('are off when the API does not mention them', async () => {
    features({ SOMETHING_ELSE: true });

    const settings = await _readServerSettings();

    expect(settings.reverseLookupEnabled).toBe(false);
    expect(settings.smsConsentEnabled).toBe(false);
  });

  it('asks the backend that publishes them once, and nothing else', async () => {
    const requests: Request[] = [];

    respond = async (request) => {
      requests.push(request);

      return new Response(JSON.stringify({}), { status: 200, headers: { 'content-type': 'application/json' } });
    };

    await _readServerSettings();

    expect(requests).toHaveLength(1);
    expect(requests[0]?.url).toBe('https://legacy.ignastrace.test/api/v1/features');
  });
});

describe('when the API cannot answer', () => {
  it('falls back to the defaults for the flags it owns, and still settles the rest', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    featuresUnreachable();
    ambientHeaders.set('cf-ipcountry', 'GB');
    vi.stubEnv('FEATURE_UPSELLS', 'true');

    const settings = await _readServerSettings();

    expect(settings.reverseLookupEnabled).toBe(false);
    expect(settings.smsConsentEnabled).toBe(false);
    expect(settings.countryCode).toBe('GB');
    expect(settings.upsellsEnabled).toBe(true);
  });

  it('says so, rather than failing closed in silence', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    featuresUnreachable();

    await _readServerSettings();

    expect(logged).toHaveBeenCalled();
  });

  it('falls back the same way when the endpoint refuses', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    features({ message: 'Forbidden' } as unknown as Record<string, boolean>, 403);

    expect((await _readServerSettings()).reverseLookupEnabled).toBe(false);
  });
});

describe('the flags the environment owns', () => {
  it('reads the upsell flow from its variable', async () => {
    vi.stubEnv('FEATURE_UPSELLS', 'true');

    expect((await _readServerSettings()).upsellsEnabled).toBe(true);
  });

  it('reads the checkout island flags from theirs', async () => {
    vi.stubEnv('FEATURE_ADYEN_GPAY', '1');
    vi.stubEnv('FEATURE_EXPRESS_CHECKOUT_AUTO', 'true');

    const settings = await _readServerSettings();

    expect(settings.adyenGPayEnabled).toBe(true);
    expect(settings.expressCheckoutDisplayAutoEnabled).toBe(true);
  });
});

describe('the ZIP code the card form asks for', () => {
  it('is asked for where the flag is on and the country expects one', async () => {
    vi.stubEnv('FEATURE_REQUEST_ZIP', 'true');
    ambientHeaders.set('cf-ipcountry', 'US');

    expect((await _readServerSettings()).checkoutZipCodeEnabled).toBe(true);
  });

  it('is not asked for where the country does not expect one', async () => {
    vi.stubEnv('FEATURE_REQUEST_ZIP', 'true');
    ambientHeaders.set('cf-ipcountry', 'GB');

    expect((await _readServerSettings()).checkoutZipCodeEnabled).toBe(false);
  });

  it('is not asked for where the flag is off, wherever the request came from', async () => {
    ambientHeaders.set('cf-ipcountry', 'US');

    expect((await _readServerSettings()).checkoutZipCodeEnabled).toBe(false);
  });
});

describe('the override cookies', () => {
  it('turn a flag the API owns on over the API', async () => {
    features({ ENABLE_REVERSE_LOOKUP: false });
    cookieJar.set(SETTINGS_OVERRIDE_COOKIES.reverseLookupEnabled, '1');

    expect((await _readServerSettings()).reverseLookupEnabled).toBe(true);
  });

  it('turn a flag the API owns off over the API', async () => {
    features({ ENABLE_REVERSE_LOOKUP: true });
    cookieJar.set(SETTINGS_OVERRIDE_COOKIES.reverseLookupEnabled, '0');

    expect((await _readServerSettings()).reverseLookupEnabled).toBe(false);
  });

  it('turn a flag the environment owns on over the environment', async () => {
    cookieJar.set(SETTINGS_OVERRIDE_COOKIES.upsellsEnabled, 'true');

    expect((await _readServerSettings()).upsellsEnabled).toBe(true);
  });

  it('override the derived ZIP code setting, country and all', async () => {
    ambientHeaders.set('cf-ipcountry', 'GB');
    cookieJar.set(SETTINGS_OVERRIDE_COOKIES.checkoutZipCodeEnabled, '1');

    expect((await _readServerSettings()).checkoutZipCodeEnabled).toBe(true);
  });
});

describe('the QA widget', () => {
  it('is turned on by the environment', async () => {
    vi.stubEnv('FEATURE_TEST_WIDGET', 'true');

    expect((await _readServerSettings()).testWidgetEnabled).toBe(true);
  });

  it('cannot be summoned by a cookie, because it reads the configuration back', async () => {
    cookieJar.set('overwrite_feature_test_widget', '1');

    expect((await _readServerSettings()).testWidgetEnabled).toBe(false);
  });
});
