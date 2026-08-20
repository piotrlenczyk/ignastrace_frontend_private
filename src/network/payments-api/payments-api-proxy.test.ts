import { sealData } from 'iron-session';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from '@/server/session/session.constants';
import type { SessionData } from '@/server/session/session.types';

import { PAYMENTS_API_PROXY_BASE_PATH } from './payments-api-proxy-path';

const PAYMENTS_API = 'https://payments.ignastrace.test/api/payments/v1';
const APP = 'https://app.ignastrace.test';
const SESSION_PASSWORD = 'a-test-sealing-password-of-at-least-32-characters';

/*
 * The request scope Next would put around a route handler, and nothing more. The
 * session itself is read for real, out of a genuinely sealed cookie, so what
 * these tests prove about the credential is what the deployed handler does.
 */
let cookieJar = new Map<string, string>();
let ambientHeaders = new Headers();

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieJar.get(name);

      return value === undefined ? undefined : { name, value };
    },
    /*
     * Decoded on the way out, as the real store decodes: what the jar holds is
     * what the browser's `Cookie` header carried, and Next hands a reader the
     * percent-decoded value. A test that skipped this step would prove the
     * upstream header round-trips when it does not.
     */
    getAll: () => [...cookieJar].map(([name, value]) => ({ name, value: decodeURIComponent(value) })),
  }),
  headers: async () => ambientHeaders,
}));

vi.stubEnv('PAYMENTS_API_BASE_URL', PAYMENTS_API);
vi.stubEnv('SESSION_PASSWORD', SESSION_PASSWORD);

/*
 * The network, substituted once and for the whole file rather than per test: the
 * generated client captures `globalThis.fetch` when it is created, so a stub
 * installed later would never be the one it calls. Each test swaps what the
 * payments service answers with instead of swapping the function.
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
 * Imported after the environment and the network are in place: the payments
 * server client reads the service's base URL and captures `fetch` the first time
 * its module runs, and `.env` is not in the repository.
 */
const { GET, POST, PUT } = await import('./payments-api-proxy');

const SESSION: SessionData = {
  isLoggedIn: true,
  accessToken: 'an-api-access-token',
  accessTokenExpiresAt: Date.now() + 60 * 60 * 1000,
  refreshToken: 'refresh-token-1',
  user: { id: 'user-1', email: 'member@example.com', type: 'USER', roles: ['STANDARD_USER'] },
  paymentsAccessToken: 'payments-access-token-1',
  paymentsAccessTokenExpiresAt: Date.now() + 60 * 60 * 1000,
  paymentsRefreshToken: 'payments-refresh-token-1',
};

/**
 * The credential this door presents. Not the session's API access token: the
 * payments upstream only recognises tokens it issued, so the session carries a
 * second pair for it.
 */
const CREDENTIAL = SESSION.paymentsAccessToken;

const seal = async (session: SessionData) =>
  sealData(session, { password: SESSION_PASSWORD, ttl: SESSION_TTL_SECONDS });

const signedIn = async () => {
  cookieJar.set(SESSION_COOKIE_NAME, await seal(SESSION));
};

/** A member signed in on an environment where no payments credential is configured. */
const signedInWithoutCredential = async () => {
  cookieJar.set(
    SESSION_COOKIE_NAME,
    await seal({
      ...SESSION,
      paymentsAccessToken: undefined,
      paymentsAccessTokenExpiresAt: undefined,
      paymentsRefreshToken: undefined,
    }),
  );
};

type Upstream = {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
};

/**
 * What the payments service answers with. Returns readers for the request it was
 * sent, so an assertion is about what actually left this process.
 */
const serve = ({ status = 200, body = { products: [] }, headers = {} }: Upstream = {}) => {
  upstreamRequests.length = 0;

  respond = async () =>
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json', ...headers },
    });

  return {
    upstreamRequest: () => {
      const [request] = upstreamRequests;

      if (!request) {
        throw new Error('The payments service was not called.');
      }

      return request;
    },
    calls: () => upstreamRequests.length,
  };
};

/**
 * A request as the browser would make it: a specification path, against this
 * application's origin, under the payments proxy's mount. Every test below names
 * the upstream path and nothing else, so an assertion that the mount came back
 * off is an assertion about the path the service was actually sent.
 */
const fromBrowser = (path: string, init?: RequestInit) =>
  new Request(`${APP}${PAYMENTS_API_PROXY_BASE_PATH}${path}`, init);

const json = (init?: RequestInit) => ({
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  ...init,
});

beforeEach(() => {
  cookieJar = new Map();
  ambientHeaders = new Headers();
});

describe('the payments proxy', () => {
  it('strips its own mount and forwards the upstream path verbatim', async () => {
    const payments = serve();

    await GET(fromBrowser('/products'));

    expect(payments.upstreamRequest().url).toBe(`${PAYMENTS_API}/products`);
  });

  it('serves every method the specification uses', async () => {
    const cases = [
      [GET, '/products', 'GET'],
      [POST, '/subscriptions/cancel', 'POST'],
      [PUT, '/users', 'PUT'],
    ] as const;

    for (const [handler, path, method] of cases) {
      const payments = serve();

      await handler(fromBrowser(path, { method }));

      expect(payments.upstreamRequest().method, path).toBe(method);
    }
  });

  it('matches a path template with a parameter in it', async () => {
    const payments = serve();

    await GET(fromBrowser('/billing/transactions/42'));

    expect(payments.upstreamRequest().url).toBe(`${PAYMENTS_API}/billing/transactions/42`);
  });

  it('refuses a path the specification does not publish, without calling the service', async () => {
    const payments = serve();

    const response = await GET(fromBrowser('/not-a-real-endpoint'));

    expect(response.status).toBe(404);
    expect(payments.calls()).toBe(0);
  });

  it('refuses a parameter that spans more than one segment', async () => {
    const payments = serve();

    const response = await GET(fromBrowser('/billing/transactions/42/refunds'));

    expect(response.status).toBe(404);
    expect(payments.calls()).toBe(0);
  });

  it('refuses every back-office family, without calling the service', async () => {
    const backOffice = [
      '/admin/subscriptions',
      '/internal/users',
      '/bot/search',
      '/webhook/stripe',
      '/price-configurator/products/apply',
      '/chargeback-experts/refundTransactionByProviderId',
    ];

    for (const path of backOffice) {
      const payments = serve();

      const response = await POST(fromBrowser(path, json()));

      expect(response.status, path).toBe(403);
      expect(payments.calls(), path).toBe(0);
    }
  });

  it('refuses a back-office path the specification has never published, as a family member', async () => {
    const payments = serve();

    const response = await GET(fromBrowser('/admin/an-endpoint-added-upstream-tomorrow'));

    expect(response.status).toBe(403);
    expect(payments.calls()).toBe(0);
  });

  it('describes its own refusals in the envelope the payments service answers in', async () => {
    serve();

    const response = await GET(fromBrowser('/not-a-real-endpoint'));

    expect(await response.json()).toEqual({
      message: 'The Payments API publishes no such path.',
      errorCode: 'PROXY_PATH_UNKNOWN',
      statusCode: 404,
    });
  });

  it("attaches the session's payments credential as the cookie the service authenticates with", async () => {
    await signedIn();
    const payments = serve();

    await GET(fromBrowser('/products/user'));

    expect(payments.upstreamRequest().headers.get('cookie')).toBe(`access-token=${CREDENTIAL}`);
  });

  it("never presents the session's API access token, which this service did not issue", async () => {
    await signedIn();
    const payments = serve();

    await GET(fromBrowser('/products/user'));

    expect(payments.upstreamRequest().headers.get('cookie')).not.toContain(SESSION.accessToken);
  });

  it('sends no cookie at all for a session holding no payments credential', async () => {
    await signedInWithoutCredential();
    const payments = serve();

    const response = await GET(fromBrowser('/products/user'));

    expect(response.status).toBe(200);
    expect(payments.upstreamRequest().headers.get('cookie')).toBeNull();
  });

  it('forwards a request without a session rather than refusing it', async () => {
    const payments = serve();

    const response = await GET(fromBrowser('/products'));

    expect(response.status).toBe(200);
    expect(payments.upstreamRequest().headers.get('cookie')).toBeNull();
  });

  it('reaches the public pricing path unauthenticated, as a visitor without an account does', async () => {
    const payments = serve({ body: { products: [{ id: 'product-1' }] } });

    const response = await GET(fromBrowser('/products'));

    expect(response.status).toBe(200);
    expect(payments.upstreamRequest().url).toBe(`${PAYMENTS_API}/products`);
    expect(payments.upstreamRequest().headers.get('cookie')).toBeNull();
  });

  it("discards a Cookie header the browser supplied, without displacing the session's", async () => {
    await signedIn();
    const payments = serve();

    await GET(fromBrowser('/products/user', { headers: { cookie: 'access-token=a-token-of-my-own' } }));

    expect(payments.upstreamRequest().headers.get('cookie')).toBe(`access-token=${CREDENTIAL}`);
  });

  it('discards a browser cookie even when there is no session to replace it with', async () => {
    const payments = serve();

    await GET(fromBrowser('/products', { headers: { cookie: 'access-token=a-token-of-my-own' } }));

    expect(payments.upstreamRequest().headers.get('cookie')).toBeNull();
  });

  it("attaches the caller's address, as the server client does for any call", async () => {
    ambientHeaders = new Headers({ 'cf-connecting-ip': '203.0.113.7' });
    const payments = serve();

    await GET(fromBrowser('/products'));

    expect(payments.upstreamRequest().headers.get('x-forwarded-for')).toBe('203.0.113.7');
  });

  it("attaches the caller's country, which is what a market is chosen by", async () => {
    ambientHeaders = new Headers({ 'cf-ipcountry': 'ES' });
    const payments = serve();

    await GET(fromBrowser('/products'));

    expect(payments.upstreamRequest().headers.get('cf-ipcountry')).toBe('ES');
  });

  it('states neither when the request scope knows nothing about the caller', async () => {
    const payments = serve();

    await GET(fromBrowser('/products'));

    const forwarded = payments.upstreamRequest().headers;

    expect(forwarded.get('x-forwarded-for')).toBeNull();
    expect(forwarded.get('cf-ipcountry')).toBeNull();
  });

  it('sends the override cookies upstream with their prefix stripped', async () => {
    cookieJar.set('payments_paymentProvider', 'stripe');
    cookieJar.set('payments_trialDays', '7');
    const payments = serve();

    await GET(fromBrowser('/products'));

    expect(payments.upstreamRequest().headers.get('cookie')).toBe('paymentProvider=stripe; trialDays=7');
  });

  it('merges the override cookies with the credential rather than displacing it', async () => {
    await signedIn();
    cookieJar.set('payments_splitPayment', 'true');
    const payments = serve();

    await GET(fromBrowser('/products/user'));

    expect(payments.upstreamRequest().headers.get('cookie')).toBe(`access-token=${CREDENTIAL}; splitPayment=true`);
  });

  it('sends the override cookies for a caller with no session at all', async () => {
    cookieJar.set('payments_paypalDisabled', 'true');
    const payments = serve();

    await GET(fromBrowser('/products'));

    expect(payments.upstreamRequest().headers.get('cookie')).toBe('paypalDisabled=true');
  });

  it('leaves every cookie without the payments prefix in the browser', async () => {
    cookieJar.set('NEXT_LOCALE', 'es');
    cookieJar.set('not_payments_trialDays', '14');
    cookieJar.set('prefix_payments_other', 'value');
    cookieJar.set('payments_', 'nothing-follows-the-prefix');
    const payments = serve();

    await GET(fromBrowser('/products'));

    expect(payments.upstreamRequest().headers.get('cookie')).toBeNull();
  });

  it('refuses an override that would name the credential upstream', async () => {
    cookieJar.set('payments_access-token', 'a-token-of-the-page-script-s-choosing');
    const payments = serve();

    await GET(fromBrowser('/products'));

    expect(payments.upstreamRequest().headers.get('cookie')).toBeNull();
  });

  it('never lets an override displace the credential the session holds', async () => {
    await signedIn();
    cookieJar.set('payments_access-token', 'a-token-of-the-page-script-s-choosing');
    const payments = serve();

    await GET(fromBrowser('/products/user'));

    expect(payments.upstreamRequest().headers.get('cookie')).toBe(`access-token=${CREDENTIAL}`);
  });

  it('re-encodes an override value the cookie store decoded, so one override stays one cookie', async () => {
    cookieJar.set('payments_paymentProvider', 'stripe%3B%20trialDays%3D999');
    const payments = serve();

    await GET(fromBrowser('/products'));

    expect(payments.upstreamRequest().headers.get('cookie')).toBe('paymentProvider=stripe%3B%20trialDays%3D999');
  });

  it('sends the credential and the overrides, and no other cookie of this origin', async () => {
    await signedIn();
    cookieJar.set('NEXT_LOCALE', 'es');
    cookieJar.set('payments_trialDays', '7');
    const payments = serve();

    await GET(fromBrowser('/products/user'));

    expect(payments.upstreamRequest().headers.get('cookie')).toBe(`access-token=${CREDENTIAL}; trialDays=7`);
  });

  it('discards an Authorization header the browser supplied', async () => {
    await signedIn();
    const payments = serve();

    await GET(fromBrowser('/products/user', { headers: { authorization: 'Bearer a-token-of-my-own' } }));

    expect(payments.upstreamRequest().headers.get('authorization')).toBeNull();
  });

  it('forwards the locale the browser stated', async () => {
    const payments = serve();

    await GET(fromBrowser('/products', { headers: { 'x-locale': 'es' } }));

    expect(payments.upstreamRequest().headers.get('x-locale')).toBe('es');
  });

  it('forwards no header the allow-list does not name', async () => {
    const payments = serve();

    await GET(
      fromBrowser('/products', {
        headers: { 'x-forwarded-host': 'evil.test', origin: APP },
      }),
    );

    const forwarded = payments.upstreamRequest().headers;

    expect(forwarded.get('x-forwarded-host')).toBeNull();
    expect(forwarded.get('origin')).toBeNull();
  });

  it('forwards the query string verbatim, repeated keys included', async () => {
    const payments = serve();

    await GET(fromBrowser('/billing/transactions?transactionTypes=upsell&transactionTypes=recurrent&page=2&q=a%20b'));

    expect(payments.upstreamRequest().url).toBe(
      `${PAYMENTS_API}/billing/transactions?transactionTypes=upsell&transactionTypes=recurrent&page=2&q=a%20b`,
    );
  });

  it('forwards a JSON request body', async () => {
    const payments = serve();
    const body = { priceId: 'price-1', nested: { list: [1, 2] } };

    await POST(fromBrowser('/subscriptions/stripe', json({ body: JSON.stringify(body) })));

    const forwarded = payments.upstreamRequest();

    expect(await forwarded.json()).toEqual(body);
    expect(forwarded.headers.get('content-type')).toBe('application/json');
  });

  it('returns the upstream status and body unchanged', async () => {
    serve({ status: 200, body: { products: [{ id: 'product-1' }] } });

    const response = await GET(fromBrowser('/products'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ products: [{ id: 'product-1' }] });
  });

  it("returns the service's refusal under the service's own status", async () => {
    const envelope = { message: 'Subscription not found', statusCode: 404 };
    serve({ status: 404, body: envelope });

    const response = await GET(fromBrowser('/subscriptions'));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual(envelope);
  });

  it('passes no Set-Cookie from the service back to the browser', async () => {
    serve({ headers: { 'set-cookie': 'access-token=1; Path=/' } });

    const response = await GET(fromBrowser('/products'));

    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('returns no response header but the content type', async () => {
    serve({ headers: { 'x-backend-instance': 'payments-7', 'cache-control': 'no-store' } });

    const response = await GET(fromBrowser('/products'));

    expect([...response.headers.keys()]).toEqual(['content-type']);
    expect(response.headers.get('content-type')).toBe('application/json');
  });

  it('refuses a body that is not valid JSON, without calling the service', async () => {
    const payments = serve();

    const response = await POST(fromBrowser('/subscriptions/stripe', json({ body: 'not json' })));

    expect(response.status).toBe(400);
    expect(payments.calls()).toBe(0);
  });
});
