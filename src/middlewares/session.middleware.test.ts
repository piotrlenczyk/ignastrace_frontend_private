import { sealData, unsealData } from 'iron-session';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getSessionPassword, SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from '@/server/session/session.constants';
import type { SessionData } from '@/server/session/session.types';

const SITE = 'https://ignastrace.io';

const API = 'https://api.ignastrace.test';

const SESSION_PASSWORD = 'a-test-sealing-password-of-at-least-32-characters';

vi.stubEnv('SESSION_PASSWORD', SESSION_PASSWORD);
vi.stubEnv('API_BASE_URL', API);

/*
 * The network, substituted once and for the whole file rather than per test: the
 * generated client the renewal goes through captures `globalThis.fetch` when it
 * is created, so a stub installed later would never be the one it calls. Each
 * test swaps what the API answers with instead of swapping the function.
 */
const upstreamRequests: Request[] = [];

let respond: (request: Request) => Promise<Response> = async (request) => {
  throw new Error(`Unexpected request to ${request.url}`);
};

vi.stubGlobal('fetch', async (request: Request) => {
  upstreamRequests.push(request);

  return respond(request);
});

/*
 * Imported after the environment and the network are in place, for the same
 * reason: the client reads the API's base URL and captures `fetch` the first time
 * its module runs, and `.env` is not in the repository.
 */
const { handleSession } = await import('./session.middleware');

const accessToken = (claims: Record<string, unknown>) => {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(claims)}.signature`;
};

const IN_AN_HOUR = Math.floor(Date.now() / 1000) + 60 * 60;

const AN_HOUR_AGO = Math.floor(Date.now() / 1000) - 60 * 60;

const FRESH_TOKEN = accessToken({ sub: 'user-1', email: 'member@example.com', type: 'USER', exp: IN_AN_HOUR });

const sessionWith = (token: string, expiresAt: number): SessionData => ({
  isLoggedIn: true,
  accessToken: token,
  accessTokenExpiresAt: expiresAt,
  refreshToken: 'refresh-1',
  user: { id: 'user-1', email: 'member@example.com', type: 'USER', roles: ['STANDARD_USER'] },
});

const VALID_SESSION = sessionWith(FRESH_TOKEN, IN_AN_HOUR * 1000);

const EXPIRED_SESSION = sessionWith(
  accessToken({ sub: 'user-1', email: 'member@example.com', type: 'USER', exp: AN_HOUR_AGO }),
  AN_HOUR_AGO * 1000,
);

/** A request carrying a genuinely sealed session, exactly as a browser sends it. */
const requestWith = async (session: SessionData | null, path = '/memberarea/find-by-number') => {
  const headers = new Headers({ 'x-forwarded-for': '203.0.113.7, 198.51.100.1' });

  if (session) {
    const sealed = await sealData(session, { password: SESSION_PASSWORD, ttl: SESSION_TTL_SECONDS });

    headers.set('cookie', `${SESSION_COOKIE_NAME}=${sealed}`);
  }

  return new NextRequest(`${SITE}${path}`, { headers });
};

type Route = { status: number; body?: unknown };

/**
 * Serves the refresh endpoint; every other URL is a test failure. Returns
 * readers for the requests that actually left this process, so an assertion is
 * about the request the API was sent rather than about the arguments a helper
 * was called with.
 */
const serveApi = (routes: Record<string, Route>) => {
  upstreamRequests.length = 0;

  respond = async (request) => {
    const path = Object.keys(routes).find((candidate) => request.url.endsWith(candidate));

    if (!path) {
      throw new Error(`Unexpected request to ${request.url}`);
    }

    const { status, body } = routes[path] as Route;

    return new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  return {
    upstreamRequest: () => {
      const [request] = upstreamRequests;

      if (!request) {
        throw new Error('The API was not called.');
      }

      return request;
    },
    calls: () => upstreamRequests.length,
  };
};

const unseal = (sealed: string) =>
  unsealData<SessionData>(sealed, { password: getSessionPassword(), ttl: SESSION_TTL_SECONDS });

/** Runs the step and applies whatever it did to a response, as the chain does. */
const runStep = async (request: NextRequest) => {
  const step = await handleSession(request);
  const response = NextResponse.next();

  await step.applyToResponse(response);

  return { ...step, response };
};

beforeEach(() => {
  serveApi({});
});

describe('handleSession', () => {
  describe('a token that is still valid', () => {
    it('passes the session through untouched', async () => {
      serveApi({});

      const { session } = await runStep(await requestWith(VALID_SESSION));

      expect(session).toEqual(VALID_SESSION);
    });

    it('leaves the response without any session cookie of its own', async () => {
      serveApi({});

      const { response } = await runStep(await requestWith(VALID_SESSION));

      expect(response.cookies.getAll()).toEqual([]);
    });

    it('does not call the API at all', async () => {
      const api = serveApi({});

      await runStep(await requestWith(VALID_SESSION));

      expect(api.calls()).toBe(0);
    });
  });

  describe('an expired token', () => {
    const renewed = { token: FRESH_TOKEN, refreshToken: 'refresh-2' };

    const serveRenewal = () => serveApi({ '/api/v1/auth/refresh-token': { status: 201, body: renewed } });

    it('exchanges the refresh token for a new pair', async () => {
      const api = serveRenewal();

      const { session } = await runStep(await requestWith(EXPIRED_SESSION));
      const upstream = api.upstreamRequest();

      expect(upstream.url).toBe(`${API}/api/v1/auth/refresh-token`);
      expect(upstream.method).toBe('POST');
      expect(await upstream.json()).toEqual({ refreshToken: 'refresh-1' });
      expect(session).toMatchObject({ accessToken: FRESH_TOKEN, refreshToken: 'refresh-2' });
    });

    it('presents the expired access token, the only credential the operation accepts', async () => {
      const api = serveRenewal();

      await runStep(await requestWith(EXPIRED_SESSION));

      expect(api.upstreamRequest().headers.get('authorization')).toBe(`Bearer ${EXPIRED_SESSION.accessToken}`);
    });

    it('keeps the identity it already had rather than probing the current-user endpoint', async () => {
      serveRenewal();

      const { session } = await runStep(await requestWith(EXPIRED_SESSION));

      expect(session?.user).toEqual(EXPIRED_SESSION.user);
    });

    it('takes the locale and the caller IP off the incoming request', async () => {
      const api = serveRenewal();

      await runStep(await requestWith(EXPIRED_SESSION, '/es/memberarea/find-by-number'));

      const { headers } = api.upstreamRequest();

      expect(headers.get('x-locale')).toBe('es');
      expect(headers.get('x-forwarded-for')).toBe('203.0.113.7');
    });

    it('rewrites the session cookie on the response', async () => {
      serveRenewal();

      const { response } = await runStep(await requestWith(EXPIRED_SESSION));

      expect(await unseal(response.cookies.get(SESSION_COOKIE_NAME)!.value)).toMatchObject({
        accessToken: FRESH_TOKEN,
        refreshToken: 'refresh-2',
        accessTokenExpiresAt: IN_AN_HOUR * 1000,
      });
    });

    it('rewrites it on the request too, so the steps after it read the new token', async () => {
      serveRenewal();

      const request = await requestWith(EXPIRED_SESSION);
      await runStep(request);

      expect(await unseal(request.cookies.get(SESSION_COOKIE_NAME)!.value)).toMatchObject({
        accessToken: FRESH_TOKEN,
      });
    });
  });

  describe('a renewal the API refuses', () => {
    const serveRefusal = () =>
      serveApi({ '/api/v1/auth/refresh-token': { status: 401, body: { message: 'Unauthorized' } } });

    it('lets the request proceed as anonymous rather than redirecting', async () => {
      serveRefusal();

      const { session, response } = await runStep(await requestWith(EXPIRED_SESSION));

      expect(session).toBeNull();
      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
    });

    it('clears the session cookie on the response', async () => {
      serveRefusal();

      const { response } = await runStep(await requestWith(EXPIRED_SESSION));

      expect(response.cookies.get(SESSION_COOKIE_NAME)?.value).toBe('');
    });

    it('clears it on the request too', async () => {
      serveRefusal();

      const request = await requestWith(EXPIRED_SESSION);
      await runStep(request);

      expect(request.cookies.get(SESSION_COOKIE_NAME)).toBeUndefined();
    });

    it('clears it when the network call throws', async () => {
      respond = async () => {
        throw new Error('Network down');
      };

      const { session, response } = await runStep(await requestWith(EXPIRED_SESSION));

      expect(session).toBeNull();
      expect(response.cookies.get(SESSION_COOKIE_NAME)?.value).toBe('');
    });
  });

  describe('a request with no session', () => {
    it('is left alone', async () => {
      const api = serveApi({});

      const { session, response } = await runStep(await requestWith(null));

      expect(session).toBeNull();
      expect(response.cookies.getAll()).toEqual([]);
      expect(api.calls()).toBe(0);
    });
  });
});
