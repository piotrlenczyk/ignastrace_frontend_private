import { sealData, unsealData } from 'iron-session';
import { type NextFetchEvent, NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TRACKING_PREFIX } from '@/constants/tracking';
import { SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from '@/server/session/session.constants';
import type { SessionData } from '@/server/session/session.types';

const SITE = 'https://ignastrace.io';

const API = 'https://api.ignastrace.test';

/**
 * Where the payments credential is renewed, and the refresh token configuration
 * seeds that renewal with. Stubbed into the environment by the payments group
 * alone: every other test in this file describes an environment where the
 * arrangement is not configured, which is what keeps them unchanged.
 */
const PAYMENTS_RENEWAL_URL = 'https://payments.ignastrace.test/api/payments/v1/auth/refresh-token';

const SEED_REFRESH_TOKEN = 'payments-refresh-seed';

const SESSION_PASSWORD = 'a-test-sealing-password-of-at-least-32-characters';

vi.stubEnv('SESSION_PASSWORD', SESSION_PASSWORD);
vi.stubEnv('API_BASE_URL', API);

/*
 * Unconfigured unless a test says otherwise, and stated rather than assumed: the
 * suite loads the developer's own environment file, so a machine that has the
 * payments credential set up would otherwise send these tests at a real host.
 */
vi.stubEnv('PAYMENTS_API_TOKEN_REFRESH_URL', undefined);
vi.stubEnv('PAYMENTS_API_SEED_REFRESH_TOKEN', undefined);

/*
 * The network, substituted once for the whole file: the generated client the
 * renewal goes through captures `globalThis.fetch` when it is created, so a stub
 * installed later would never be the one it calls. Each test swaps what the API
 * answers with instead of swapping the function.
 */
const upstreamRequests: Request[] = [];

let respond: (request: Request) => Promise<Response> = async (request) => {
  throw new Error(`Unexpected request to ${request.url}`);
};

/*
 * The payments credential's renewal answers separately, because it is a second
 * and independent branch of the same step: a test about one pair states nothing
 * about the other's endpoint, and an unexpected call to either one raises.
 */
let respondToPayments: (request: Request) => Promise<Response> = async (request) => {
  throw new Error(`Unexpected request to ${request.url}`);
};

vi.stubGlobal('fetch', async (input: Request | string, init?: RequestInit) => {
  // The API's renewal goes through the generated client, which hands over a
  // `Request`; the payments one is a bare call, with a URL and an init object.
  const request = input instanceof Request ? input : new Request(input, init);

  upstreamRequests.push(request);

  return request.url === PAYMENTS_RENEWAL_URL ? respondToPayments(request) : respond(request);
});

/*
 * Imported after the environment and the network are in place, for the same
 * reason: the client reads the API's base URL and captures `fetch` the first
 * time its module runs, and `.env` is not in the repository.
 */
const { default: middleware } = await import('./middleware');

const accessToken = (claims: Record<string, unknown>) => {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(claims)}.signature`;
};

const IN_AN_HOUR = Math.floor(Date.now() / 1000) + 60 * 60;

const AN_HOUR_AGO = Math.floor(Date.now() / 1000) - 60 * 60;

const FRESH_TOKEN = accessToken({
  id: 'user-1',
  email: 'member@example.com',
  type: 'USER',
  roles: ['STANDARD_USER'],
  iat: AN_HOUR_AGO,
  exp: IN_AN_HOUR,
});

const sessionWith = (token: string, expiresAt: number): SessionData => ({
  isLoggedIn: true,
  accessToken: token,
  accessTokenExpiresAt: expiresAt,
  refreshToken: 'refresh-1',
  user: { id: 'user-1', email: 'member@example.com', type: 'USER', roles: ['STANDARD_USER'] },
});

const VALID_SESSION = sessionWith(FRESH_TOKEN, IN_AN_HOUR * 1000);

const EXPIRED_SESSION = sessionWith(
  accessToken({
    id: 'user-1',
    email: 'member@example.com',
    type: 'USER',
    roles: ['STANDARD_USER'],
    iat: AN_HOUR_AGO,
    exp: AN_HOUR_AGO,
  }),
  AN_HOUR_AGO * 1000,
);

/** A request carrying a genuinely sealed session, exactly as a browser sends it. */
const requestWith = async (session: SessionData | null, path = '/memberarea/find-by-number') => {
  const headers = new Headers({ 'x-forwarded-for': '203.0.113.7, 198.51.100.1' });

  if (session) {
    headers.set(
      'cookie',
      `${SESSION_COOKIE_NAME}=${await sealData(session, { password: SESSION_PASSWORD, ttl: SESSION_TTL_SECONDS })}`,
    );
  }

  return new NextRequest(`${SITE}${path}`, { headers });
};

/** The renewal endpoint, answering however the test needs it to. */
const serveRenewal = (route: { status: number; body?: unknown }) => {
  upstreamRequests.length = 0;

  respond = async (request) => {
    if (!request.url.endsWith('/api/v1/auth/refresh-token')) {
      throw new Error(`Unexpected request to ${request.url}`);
    }

    return new Response(route.body === undefined ? null : JSON.stringify(route.body), {
      status: route.status,
      headers: { 'Content-Type': 'application/json' },
    });
  };
};

const RENEWED = { token: FRESH_TOKEN, refreshToken: 'refresh-2' };

const serveRenewalSuccess = () => serveRenewal({ status: 201, body: RENEWED });

const serveRenewalRefusal = () => serveRenewal({ status: 401, body: { message: 'Unauthorized' } });

/** The payments credential's renewal endpoint, answering however the test needs it to. */
const servePaymentsRenewal = (route: { status: number; body?: unknown }) => {
  respondToPayments = async () =>
    new Response(route.body === undefined ? null : JSON.stringify(route.body), {
      status: route.status,
      headers: { 'Content-Type': 'application/json' },
    });
};

const apiCalls = () => upstreamRequests.length;

const paymentsRenewals = () => upstreamRequests.filter((request) => request.url === PAYMENTS_RENEWAL_URL);

/** The request the payments upstream was actually sent, rather than the one a helper described. */
const paymentsRenewalRequest = () => {
  const [request] = paymentsRenewals();

  if (!request) {
    throw new Error('The payments upstream was not called.');
  }

  return request;
};

/** The request the API was actually sent, rather than the arguments a helper was called with. */
const upstreamRequest = () => {
  const [request] = upstreamRequests;

  if (!request) {
    throw new Error('The API was not called.');
  }

  return request;
};

/*
 * The chain's own signature. The event is never read by any step, and there is
 * nothing in this runtime to build a real one from.
 */
const run = (request: NextRequest) => middleware(request, {} as NextFetchEvent);

const unseal = (sealed: string) =>
  unsealData<SessionData>(sealed, { password: SESSION_PASSWORD, ttl: SESSION_TTL_SECONDS });

const sessionCookieOf = (response: Response) => {
  const header = response.headers.getSetCookie().find((cookie) => cookie.startsWith(`${SESSION_COOKIE_NAME}=`));

  return header?.slice(`${SESSION_COOKIE_NAME}=`.length).split(';')[0] ?? null;
};

beforeEach(() => {
  serveRenewal({ status: 500 });
  respondToPayments = async (request) => {
    throw new Error(`Unexpected request to ${request.url}`);
  };
  upstreamRequests.length = 0;
});

describe('middleware', () => {
  describe('the health check', () => {
    it('answers before any other step runs', async () => {
      serveRenewalSuccess();

      const response = await run(await requestWith(EXPIRED_SESSION, '/health'));

      expect(response.status).toBe(200);
      expect(apiCalls()).toBe(0);
      expect(response.headers.get('x-pathname')).toBeNull();
    });
  });

  describe('case normalisation', () => {
    it('redirects an upper-case path before the session step gets a chance to renew', async () => {
      serveRenewalSuccess();

      const response = await run(await requestWith(EXPIRED_SESSION, '/MemberArea/Find-By-Number'));

      expect(response.status).toBe(308);
      expect(response.headers.get('location')).toBe(`${SITE}/memberarea/find-by-number`);
      expect(apiCalls()).toBe(0);
    });
  });

  describe('a route handler', () => {
    /*
     * One case per door this application serves: its own endpoints, the browser's
     * door onto the API, and the browser's door onto the Payments API. Each is a
     * separate mount, so each has to be named in the middleware's prefixes — a
     * door left off the list takes the page chain instead, and the locale step
     * rewrites the response its caller is waiting for into a navigation.
     */
    const ROUTE_HANDLERS = ['/api/checkout/session', '/api-proxy/api/v1/users/me', '/payments-api-proxy/products'];

    it.each(ROUTE_HANDLERS)('renews the token on %s and returns the handler its own response', async (path) => {
      serveRenewalSuccess();

      const response = await run(await requestWith(EXPIRED_SESSION, path));

      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
      expect(await unseal(sessionCookieOf(response)!)).toMatchObject({ refreshToken: 'refresh-2' });
    });

    it.each(ROUTE_HANDLERS)('is not rewritten by the locale step on %s', async (path) => {
      const response = await run(await requestWith(VALID_SESSION, path));

      expect(response.headers.get('x-middleware-rewrite')).toBeNull();
    });

    it.each(ROUTE_HANDLERS)('is not redirected by the guard on %s, even anonymously', async (path) => {
      const response = await run(await requestWith(null, path));

      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
    });
  });

  describe('a token that is still valid', () => {
    it('is passed through without the API being asked anything', async () => {
      const response = await run(await requestWith(VALID_SESSION));

      expect(apiCalls()).toBe(0);
      expect(sessionCookieOf(response)).toBeNull();
      expect(response.headers.get('location')).toBeNull();
    });
  });

  describe('the session step, ahead of the guard', () => {
    it('renews first, so a member whose token had run out is not sent to the login page', async () => {
      serveRenewalSuccess();

      const response = await run(await requestWith(EXPIRED_SESSION));

      expect(response.headers.get('location')).toBeNull();
      expect(await unseal(sessionCookieOf(response)!)).toMatchObject({ refreshToken: 'refresh-2' });
    });

    it('carries on anonymously when the renewal is refused, leaving the guard to redirect', async () => {
      serveRenewalRefusal();

      const response = await run(await requestWith(EXPIRED_SESSION));

      expect(response.headers.get('location')).toBe(
        `${SITE}/login?redirect=${encodeURIComponent('/memberarea/find-by-number')}`,
      );
    });

    it('clears the dead cookie on the redirect the guard produced', async () => {
      serveRenewalRefusal();

      const response = await run(await requestWith(EXPIRED_SESSION));

      expect(sessionCookieOf(response)).toBe('');
    });

    it('writes the renewed cookie onto a redirect too, when the guard still redirects', async () => {
      serveRenewalSuccess();

      const response = await run(await requestWith(EXPIRED_SESSION, '/login'));

      expect(response.headers.get('location')).toBe(`${SITE}/memberarea/find-by-number`);
      expect(await unseal(sessionCookieOf(response)!)).toMatchObject({ refreshToken: 'refresh-2' });
    });

    it('rewrites the request cookie as well, so the locale step reads the new token', async () => {
      serveRenewalSuccess();

      const request = await requestWith(EXPIRED_SESSION, '/pricing');
      await run(request);

      expect(await unseal(request.cookies.get(SESSION_COOKIE_NAME)!.value)).toMatchObject({
        accessToken: FRESH_TOKEN,
        refreshToken: 'refresh-2',
      });
    });

    it('reads the identity back out of the renewed token, so the next request still finds a session', async () => {
      serveRenewalSuccess();

      const response = await run(await requestWith(EXPIRED_SESSION, '/pricing'));

      expect(await unseal(sessionCookieOf(response)!)).toEqual({
        isLoggedIn: true,
        accessToken: FRESH_TOKEN,
        accessTokenExpiresAt: IN_AN_HOUR * 1000,
        refreshToken: 'refresh-2',
        user: { id: 'user-1', email: 'member@example.com', type: 'USER', roles: ['STANDARD_USER'] },
      });
    });

    it('presents the expired access token, the only credential the renewal accepts', async () => {
      serveRenewalSuccess();

      await run(await requestWith(EXPIRED_SESSION));

      expect(upstreamRequest().headers.get('authorization')).toBe(`Bearer ${EXPIRED_SESSION.accessToken}`);
    });

    it('takes the locale and the caller IP off the incoming request', async () => {
      serveRenewalSuccess();

      await run(await requestWith(EXPIRED_SESSION, '/es/memberarea/find-by-number'));

      const { headers } = upstreamRequest();

      expect(headers.get('x-locale')).toBe('es');
      expect(headers.get('x-forwarded-for')).toBe('203.0.113.7');
    });
  });

  /*
   * The payments credential: a second, independent branch of the same step,
   * covered through the same seam. The configuration is stubbed for these tests
   * only — everywhere else in this file the arrangement is unconfigured, which is
   * both the deployment case worth covering and what keeps the tests above
   * describing the API pair alone.
   */
  describe('the payments credential', () => {
    const PAYMENTS_TOKEN = accessToken({ exp: IN_AN_HOUR });

    const RENEWED_PAYMENTS = { token: PAYMENTS_TOKEN, refreshToken: 'payments-refresh-2' };

    const servePaymentsRenewalSuccess = () => servePaymentsRenewal({ status: 201, body: RENEWED_PAYMENTS });

    const servePaymentsRenewalRefusal = () => servePaymentsRenewal({ status: 401, body: { message: 'Unauthorized' } });

    /** A session carrying a payments credential that has already run out. */
    const WITH_STALE_CREDENTIAL: SessionData = {
      ...VALID_SESSION,
      paymentsAccessToken: accessToken({ exp: AN_HOUR_AGO }),
      paymentsAccessTokenExpiresAt: AN_HOUR_AGO * 1000,
      paymentsRefreshToken: 'payments-refresh-1',
    };

    /** A session whose payments credential is good for another hour. */
    const WITH_LIVE_CREDENTIAL: SessionData = {
      ...VALID_SESSION,
      paymentsAccessToken: PAYMENTS_TOKEN,
      paymentsAccessTokenExpiresAt: IN_AN_HOUR * 1000,
      paymentsRefreshToken: 'payments-refresh-1',
    };

    beforeEach(() => {
      vi.stubEnv('PAYMENTS_API_TOKEN_REFRESH_URL', PAYMENTS_RENEWAL_URL);
      vi.stubEnv('PAYMENTS_API_SEED_REFRESH_TOKEN', SEED_REFRESH_TOKEN);
    });

    afterEach(() => {
      vi.stubEnv('PAYMENTS_API_TOKEN_REFRESH_URL', undefined);
      vi.stubEnv('PAYMENTS_API_SEED_REFRESH_TOKEN', undefined);
      // The incidents below are logged deliberately, and the suite is set up to
      // fail on a stray one — so the console goes back as it was found.
      vi.restoreAllMocks();
    });

    it('is seeded from configuration when the session holds none', async () => {
      servePaymentsRenewalSuccess();

      const response = await run(await requestWith(VALID_SESSION));
      const renewal = paymentsRenewalRequest();

      expect(renewal.method).toBe('POST');
      expect(await renewal.json()).toEqual({ refreshToken: SEED_REFRESH_TOKEN });
      expect(await unseal(sessionCookieOf(response)!)).toMatchObject({
        paymentsAccessToken: PAYMENTS_TOKEN,
        paymentsAccessTokenExpiresAt: IN_AN_HOUR * 1000,
        paymentsRefreshToken: 'payments-refresh-2',
      });
    });

    it('spends the rotated refresh token the session holds rather than the seed', async () => {
      servePaymentsRenewalSuccess();

      const response = await run(await requestWith(WITH_STALE_CREDENTIAL));

      expect(await paymentsRenewalRequest().json()).toEqual({ refreshToken: 'payments-refresh-1' });
      expect(await unseal(sessionCookieOf(response)!)).toMatchObject({ paymentsRefreshToken: 'payments-refresh-2' });
    });

    it('leaves a credential that has not run out alone, without asking the upstream anything', async () => {
      const response = await run(await requestWith(WITH_LIVE_CREDENTIAL));

      expect(paymentsRenewals()).toHaveLength(0);
      expect(sessionCookieOf(response)).toBeNull();
    });

    it('renews a credential that will not decode, rather than reading its expiry as valid forever', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      servePaymentsRenewal({ status: 201, body: { token: 'not-a-token', refreshToken: 'payments-refresh-2' } });

      const response = await run(await requestWith(VALID_SESSION));

      expect(await unseal(sessionCookieOf(response)!)).toMatchObject({
        paymentsAccessToken: 'not-a-token',
        paymentsAccessTokenExpiresAt: 0,
      });
    });

    it('clears the three fields when the renewal is refused, and logs the incident', async () => {
      const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
      servePaymentsRenewalRefusal();

      const response = await run(await requestWith(WITH_STALE_CREDENTIAL));
      const sealed = await unseal(sessionCookieOf(response)!);

      expect(sealed.paymentsAccessToken).toBeUndefined();
      expect(sealed.paymentsAccessTokenExpiresAt).toBeUndefined();
      expect(sealed.paymentsRefreshToken).toBeUndefined();
      expect(logged).toHaveBeenCalled();
    });

    it('leaves the member signed in when the renewal is refused', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      servePaymentsRenewalRefusal();

      const response = await run(await requestWith(WITH_STALE_CREDENTIAL));

      expect(response.headers.get('location')).toBeNull();
      expect(await unseal(sessionCookieOf(response)!)).toMatchObject({
        isLoggedIn: true,
        accessToken: VALID_SESSION.accessToken,
        refreshToken: 'refresh-1',
      });
    });

    it('leaves the API pair exactly as it was, and asks the API nothing', async () => {
      servePaymentsRenewalSuccess();

      const response = await run(await requestWith(VALID_SESSION));

      expect(paymentsRenewals()).toHaveLength(apiCalls());
      expect(await unseal(sessionCookieOf(response)!)).toMatchObject({
        accessToken: VALID_SESSION.accessToken,
        accessTokenExpiresAt: IN_AN_HOUR * 1000,
        refreshToken: 'refresh-1',
        user: VALID_SESSION.user,
      });
    });

    it('seals both pairs into the one cookie when each has run out', async () => {
      serveRenewalSuccess();
      servePaymentsRenewalSuccess();

      const response = await run(await requestWith(EXPIRED_SESSION));

      expect(await unseal(sessionCookieOf(response)!)).toMatchObject({
        refreshToken: 'refresh-2',
        paymentsRefreshToken: 'payments-refresh-2',
      });
    });

    it('carries the credential across an API renewal rather than renewing it too', async () => {
      serveRenewalSuccess();

      const expiredWithLiveCredential: SessionData = {
        ...EXPIRED_SESSION,
        paymentsAccessToken: PAYMENTS_TOKEN,
        paymentsAccessTokenExpiresAt: IN_AN_HOUR * 1000,
        paymentsRefreshToken: 'payments-refresh-1',
      };

      const response = await run(await requestWith(expiredWithLiveCredential));

      expect(paymentsRenewals()).toHaveLength(0);
      expect(await unseal(sessionCookieOf(response)!)).toMatchObject({
        refreshToken: 'refresh-2',
        paymentsAccessToken: PAYMENTS_TOKEN,
        paymentsRefreshToken: 'payments-refresh-1',
      });
    });

    it('renews on the payments proxy, which needs the credential as much as a page does', async () => {
      servePaymentsRenewalSuccess();

      const response = await run(await requestWith(VALID_SESSION, '/payments-api-proxy/products/user'));

      expect(response.status).toBe(200);
      expect(await unseal(sessionCookieOf(response)!)).toMatchObject({ paymentsRefreshToken: 'payments-refresh-2' });
    });

    it('rewrites the request cookie too, so the payments proxy reads what was just renewed', async () => {
      servePaymentsRenewalSuccess();

      const request = await requestWith(VALID_SESSION, '/payments-api-proxy/products/user');
      await run(request);

      expect(await unseal(request.cookies.get(SESSION_COOKIE_NAME)!.value)).toMatchObject({
        paymentsAccessToken: PAYMENTS_TOKEN,
      });
    });

    it('mints nothing for a visitor without a session', async () => {
      const response = await run(await requestWith(null, '/pricing'));

      expect(paymentsRenewals()).toHaveLength(0);
      expect(sessionCookieOf(response)).toBeNull();
    });
  });

  describe('the payments credential, unconfigured', () => {
    it('is never asked for, and the session does not grow', async () => {
      const response = await run(await requestWith(VALID_SESSION));

      expect(apiCalls()).toBe(0);
      expect(sessionCookieOf(response)).toBeNull();
    });

    it('is dropped from a session that still carries one, so unsetting the configuration switches it off', async () => {
      const response = await run(
        await requestWith({ ...VALID_SESSION, paymentsAccessToken: 'a-credential-from-yesterday' }),
      );

      const sealed = await unseal(sessionCookieOf(response)!);

      expect(apiCalls()).toBe(0);
      expect(sealed.paymentsAccessToken).toBeUndefined();
      expect(sealed.accessToken).toBe(VALID_SESSION.accessToken);
    });
  });

  describe('the guard, ahead of the locale step', () => {
    it('answers a protected page with a redirect rather than a locale rewrite', async () => {
      const response = await run(await requestWith(null));

      expect(response.headers.get('location')).toBe(
        `${SITE}/login?redirect=${encodeURIComponent('/memberarea/find-by-number')}`,
      );
      expect(response.headers.get('x-middleware-rewrite')).toBeNull();
    });

    it('hands a page it lets through to the locale step', async () => {
      const response = await run(await requestWith(null, '/pricing'));

      expect(response.headers.get('location')).toBeNull();
      expect(response.headers.get('x-middleware-rewrite')).toBe(`${SITE}/en/pricing`);
    });
  });

  describe('tracking, last of all', () => {
    it('adds its cookies to the response the steps before it produced', async () => {
      const response = await run(await requestWith(null, '/pricing?utm_source=facebook'));

      expect(response.headers.getSetCookie().some((cookie) => cookie.startsWith(`${TRACKING_PREFIX}utm_source=`))).toBe(
        true,
      );
      expect(response.headers.get('x-middleware-rewrite')).toBe(`${SITE}/en/pricing?utm_source=facebook`);
    });

    it('leaves a page carrying nothing but an internal parameter alone', async () => {
      const response = await run(await requestWith(null, '/pricing?plan=subscription'));

      expect(response.headers.getSetCookie().filter((cookie) => cookie.startsWith(TRACKING_PREFIX))).toEqual([]);
    });

    it('keeps the session cookie the step before it wrote', async () => {
      serveRenewalSuccess();

      const response = await run(await requestWith(EXPIRED_SESSION, '/memberarea/find-by-number?utm_source=facebook'));

      expect(await unseal(sessionCookieOf(response)!)).toMatchObject({ refreshToken: 'refresh-2' });
      expect(response.headers.getSetCookie().some((cookie) => cookie.startsWith(`${TRACKING_PREFIX}utm_source=`))).toBe(
        true,
      );
    });
  });

  describe('the pathname header', () => {
    it('carries the path the visitor asked for', async () => {
      const response = await run(await requestWith(null, '/pricing'));

      expect(response.headers.get('x-pathname')).toBe('/pricing');
    });

    it('is set on a guard redirect as well', async () => {
      const response = await run(await requestWith(null));

      expect(response.headers.get('x-pathname')).toBe('/memberarea/find-by-number');
    });
  });
});
