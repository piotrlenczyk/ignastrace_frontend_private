import { sealData } from 'iron-session';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from '@/server/session/session.constants';
import type { SessionData } from '@/server/session/session.types';

const LEGACY = 'https://legacy.ignastrace.test/api/v1';
const APP = 'https://app.ignastrace.test';
const SESSION_PASSWORD = 'a-test-sealing-password-of-at-least-32-characters';

/*
 * The request scope Next would put around a route handler, and nothing more. The
 * session is read for real, out of a genuinely sealed cookie, so what these
 * tests prove about the bearer is what the deployed handler does.
 */
let cookieJar = new Map<string, string>();

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieJar.get(name);

      return value === undefined ? undefined : { name, value };
    },
  }),
}));

vi.stubEnv('INTERNAL_API_URL', '');
vi.stubEnv('NEXT_PUBLIC_API_URL', LEGACY);
vi.stubEnv('SESSION_PASSWORD', SESSION_PASSWORD);

const upstreamCalls: { url: string; init: RequestInit }[] = [];

let respond: () => Response = () => {
  throw new Error('No upstream response was set up for this test.');
};

vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
  upstreamCalls.push({ url, init });

  return respond();
});

const { DELETE, GET, PATCH, POST, PUT } = await import('./legacy-proxy');

const SESSION: SessionData = {
  isLoggedIn: true,
  accessToken: 'access-token-1',
  accessTokenExpiresAt: Date.now() + 60 * 60 * 1000,
  refreshToken: 'refresh-token-1',
  user: { id: 'user-1', email: 'member@example.com', type: 'USER', roles: ['STANDARD_USER'] },
};

const signedIn = async () => {
  cookieJar.set(SESSION_COOKIE_NAME, await sealData(SESSION, { password: SESSION_PASSWORD, ttl: SESSION_TTL_SECONDS }));
};

type Upstream = {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
};

/**
 * What the legacy backend answers with. Returns readers for the call it was
 * sent, so an assertion is about what actually left this process.
 */
const serve = ({ status = 200, body = { id: 'user-1' }, headers = {} }: Upstream = {}) => {
  upstreamCalls.length = 0;

  respond = () =>
    new Response(body === null ? null : JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json', ...headers },
    });

  return {
    call: () => {
      const [call] = upstreamCalls;

      if (!call) {
        throw new Error('The legacy backend was not called.');
      }

      return { ...call, headers: new Headers(call.init.headers) };
    },
    calls: () => upstreamCalls.length,
  };
};

/** A request as the browser would make it, against this application's origin. */
const fromBrowser = (path: string, init?: RequestInit) => new Request(`${APP}/api/legacy${path}`, init);

const json = (init?: RequestInit) => ({
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  ...init,
});

beforeEach(() => {
  cookieJar = new Map();
});

describe('the legacy proxy', () => {
  it('forwards the path under the host configured for the legacy backend', async () => {
    const legacy = serve();

    await GET(fromBrowser('/user'));

    expect(legacy.call().url).toBe(`${LEGACY}/user`);
  });

  it('serves every method the legacy client uses', async () => {
    const cases = [
      [GET, 'GET'],
      [POST, 'POST'],
      [PUT, 'PUT'],
      [PATCH, 'PATCH'],
      [DELETE, 'DELETE'],
    ] as const;

    for (const [handler, method] of cases) {
      const legacy = serve();

      await handler(fromBrowser('/user', { method }));

      expect(legacy.call().init.method).toBe(method);
    }
  });

  it('validates no path: the fixed host is what bounds this proxy', async () => {
    const legacy = serve();

    await GET(fromBrowser('/anything/at/all/the/backend/might/publish'));

    expect(legacy.call().url).toBe(`${LEGACY}/anything/at/all/the/backend/might/publish`);
  });

  it('forwards the query string verbatim, repeated keys included', async () => {
    const legacy = serve();

    await GET(fromBrowser('/notifications?status=NEW&status=READ&page=2&q=a%20b'));

    expect(legacy.call().url).toBe(`${LEGACY}/notifications?status=NEW&status=READ&page=2&q=a%20b`);
  });

  it("attaches the session's access token", async () => {
    await signedIn();
    const legacy = serve();

    await GET(fromBrowser('/user'));

    expect(legacy.call().headers.get('authorization')).toBe(`Bearer ${SESSION.accessToken}`);
  });

  it('discards an Authorization header the browser supplied', async () => {
    await signedIn();
    const legacy = serve();

    await GET(fromBrowser('/user', { headers: { authorization: 'Bearer a-token-of-my-own' } }));

    expect(legacy.call().headers.get('authorization')).toBe(`Bearer ${SESSION.accessToken}`);
  });

  it('discards a browser bearer even when there is no session to replace it with', async () => {
    const legacy = serve();

    await GET(fromBrowser('/user', { headers: { authorization: 'Bearer a-token-of-my-own' } }));

    expect(legacy.call().headers.get('authorization')).toBeNull();
  });

  it('forwards a request without a session rather than refusing it', async () => {
    const legacy = serve();

    const response = await GET(fromBrowser('/products'));

    expect(response.status).toBe(200);
    expect(legacy.calls()).toBe(1);
  });

  it('forwards no request header the allow-list does not name', async () => {
    const legacy = serve();

    await GET(
      fromBrowser('/user', {
        headers: { cookie: 'ignastrace_session=stolen', 'x-forwarded-host': 'evil.test', origin: APP },
      }),
    );

    const forwarded = legacy.call().headers;

    expect(forwarded.get('cookie')).toBeNull();
    expect(forwarded.get('x-forwarded-host')).toBeNull();
    expect(forwarded.get('origin')).toBeNull();
  });

  it('forwards the request body untouched', async () => {
    const legacy = serve();
    const body = JSON.stringify({ locale: 'es', nested: { list: [1, 2] } });

    await PUT(fromBrowser('/user', json({ method: 'PUT', body })));

    const call = legacy.call();

    expect(call.init.body).toBe(body);
    expect(call.headers.get('content-type')).toBe('application/json');
  });

  it('sends no body for a request that carries none', async () => {
    const legacy = serve();

    await GET(fromBrowser('/user'));

    expect(legacy.call().init.body).toBeUndefined();
  });

  it('returns the upstream status and body unchanged', async () => {
    serve({ status: 200, body: { id: 'user-1', email: 'member@example.com' } });

    const response = await GET(fromBrowser('/user'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: 'user-1', email: 'member@example.com' });
  });

  it("returns the backend's refusal under the backend's own status", async () => {
    serve({ status: 422, body: { errors: { email: [{ error: 'taken' }] } } });

    const response = await GET(fromBrowser('/user'));

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ errors: { email: [{ error: 'taken' }] } });
  });

  it('lets a 401 through, so the client can sign the member out', async () => {
    await signedIn();
    serve({ status: 401, body: { message: 'Unauthorized' } });

    const response = await GET(fromBrowser('/user'));

    expect(response.status).toBe(401);
  });

  it('passes no response header back to the browser', async () => {
    serve({ headers: { 'set-cookie': 'backend_session=1; Path=/', 'x-backend-instance': 'legacy-7' } });

    const response = await GET(fromBrowser('/user'));

    expect([...response.headers.keys()]).toEqual([]);
  });

  it('returns an empty answer for a status that may carry no body', async () => {
    serve({ status: 204, body: null });

    const response = await GET(fromBrowser('/user'));

    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
  });
});
