import { sealData } from 'iron-session';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from '@/server/session/session.constants';
import type { SessionData } from '@/server/session/session.types';

const API = 'https://api.ignastrace.test';
const APP = 'https://app.ignastrace.test';
const SESSION_PASSWORD = 'a-test-sealing-password-of-at-least-32-characters';

/*
 * The request scope Next would put around a route handler, and nothing more. The
 * session itself is read for real, out of a genuinely sealed cookie, so what
 * these tests prove about the bearer is what the deployed handler does.
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

vi.stubEnv('API_BASE_URL', API);
vi.stubEnv('SESSION_PASSWORD', SESSION_PASSWORD);

/*
 * The network, substituted once and for the whole file rather than per test: the
 * generated client captures `globalThis.fetch` when it is created, so a stub
 * installed later would never be the one it calls. Each test swaps what the API
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
 * Imported after the environment and the network are in place: the server client
 * reads the API's base URL and captures `fetch` the first time its module runs,
 * and `.env` is not in the repository.
 */
const { DELETE, GET, PATCH, POST, PUT } = await import('./api-proxy');

const SESSION: SessionData = {
  isLoggedIn: true,
  accessToken: 'access-token-1',
  accessTokenExpiresAt: Date.now() + 60 * 60 * 1000,
  refreshToken: 'refresh-token-1',
  user: { id: 'user-1', email: 'member@example.com' },
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
 * What the API answers with. Returns readers for the request it was sent, so an
 * assertion is about what actually left this process.
 */
const serve = ({ status = 200, body = { id: 'user-1' }, headers = {} }: Upstream = {}) => {
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
        throw new Error('The API was not called.');
      }

      return request;
    },
    calls: () => upstreamRequests.length,
  };
};

/** A request as the browser would make it, against this application's origin. */
const fromBrowser = (path: string, init?: RequestInit) => new Request(`${APP}${path}`, init);

const json = (init?: RequestInit) => ({
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  ...init,
});

beforeEach(() => {
  cookieJar = new Map();
  ambientHeaders = new Headers();
});

describe('the API proxy', () => {
  it('mounts the upstream path verbatim', async () => {
    const api = serve();

    await GET(fromBrowser('/api/v1/user/me'));

    expect(api.upstreamRequest().url).toBe(`${API}/api/v1/user/me`);
  });

  it('serves every method the specification uses', async () => {
    const cases = [
      [GET, '/api/v1/user/me', 'GET'],
      [POST, '/api/v1/support/contact-us', 'POST'],
      [PUT, '/api/v1/user', 'PUT'],
      [PATCH, '/api/v1/admin/users/7', 'PATCH'],
      [DELETE, '/api/v1/user/me/delete', 'DELETE'],
    ] as const;

    for (const [handler, path, method] of cases) {
      const api = serve();

      await handler(fromBrowser(path, { method }));

      expect(api.upstreamRequest().method).toBe(method);
    }
  });

  it('matches a path template with a parameter in it', async () => {
    const api = serve();

    await GET(fromBrowser('/api/v1/reverse-lookup-reports/42/sections'));

    expect(api.upstreamRequest().url).toBe(`${API}/api/v1/reverse-lookup-reports/42/sections`);
  });

  it('refuses a path the specification does not publish, without calling the API', async () => {
    const api = serve();

    const response = await GET(fromBrowser('/api/v1/not-a-real-endpoint'));

    expect(response.status).toBe(404);
    expect(api.calls()).toBe(0);
  });

  it('refuses a parameter that spans more than one segment', async () => {
    const api = serve();

    const response = await GET(fromBrowser('/api/v1/admin/users/7/sessions'));

    expect(response.status).toBe(404);
    expect(api.calls()).toBe(0);
  });

  it('refuses the authentication endpoints, without calling the API', async () => {
    const api = serve();

    const response = await POST(fromBrowser('/api/v1/auth/login', json()));

    expect(response.status).toBe(403);
    expect(api.calls()).toBe(0);
  });

  it('describes its own refusals in the API error envelope', async () => {
    serve();

    const response = await GET(fromBrowser('/api/v1/not-a-real-endpoint'));

    expect(await response.json()).toEqual({
      error: {
        message: 'The API publishes no such path.',
        errorCode: 'PROXY_PATH_UNKNOWN',
        code: 'NOT_FOUND',
      },
    });
  });

  it("attaches the session's access token", async () => {
    await signedIn();
    const api = serve();

    await GET(fromBrowser('/api/v1/user/me'));

    expect(api.upstreamRequest().headers.get('authorization')).toBe(`Bearer ${SESSION.accessToken}`);
  });

  it('discards an Authorization header the browser supplied', async () => {
    await signedIn();
    const api = serve();

    await GET(fromBrowser('/api/v1/user/me', { headers: { authorization: 'Bearer a-token-of-my-own' } }));

    expect(api.upstreamRequest().headers.get('authorization')).toBe(`Bearer ${SESSION.accessToken}`);
  });

  it('forwards a request without a session rather than refusing it', async () => {
    const api = serve();

    const response = await GET(fromBrowser('/api/v1/reverse-lookup-reports/usage-count'));

    expect(response.status).toBe(200);
    expect(api.upstreamRequest().headers.get('authorization')).toBeNull();
  });

  it('discards a browser bearer even when there is no session to replace it with', async () => {
    const api = serve();

    await GET(fromBrowser('/api/v1/user/me', { headers: { authorization: 'Bearer a-token-of-my-own' } }));

    expect(api.upstreamRequest().headers.get('authorization')).toBeNull();
  });

  it('forwards the locale the browser stated', async () => {
    const api = serve();

    await GET(fromBrowser('/api/v1/user/me', { headers: { 'x-locale': 'es' } }));

    expect(api.upstreamRequest().headers.get('x-locale')).toBe('es');
  });

  it("attaches the caller's address, as the server client does for any call", async () => {
    ambientHeaders = new Headers({ 'cf-connecting-ip': '203.0.113.7' });
    const api = serve();

    await GET(fromBrowser('/api/v1/user/me'));

    expect(api.upstreamRequest().headers.get('x-forwarded-for')).toBe('203.0.113.7');
  });

  it('forwards no header the allow-list does not name', async () => {
    const api = serve();

    await GET(
      fromBrowser('/api/v1/user/me', {
        headers: { cookie: 'ignastrace_session=stolen', 'x-forwarded-host': 'evil.test', origin: APP },
      }),
    );

    const forwarded = api.upstreamRequest().headers;

    expect(forwarded.get('cookie')).toBeNull();
    expect(forwarded.get('x-forwarded-host')).toBeNull();
    expect(forwarded.get('origin')).toBeNull();
  });

  it('forwards the query string verbatim, repeated keys included', async () => {
    const api = serve();

    await GET(fromBrowser('/api/v1/activity-feed?status=DONE&status=FAILED&page=2&q=a%20b'));

    expect(api.upstreamRequest().url).toBe(`${API}/api/v1/activity-feed?status=DONE&status=FAILED&page=2&q=a%20b`);
  });

  it('forwards a JSON request body', async () => {
    const api = serve();
    const body = { subject: 'Help', message: 'Please', nested: { list: [1, 2] } };

    await POST(fromBrowser('/api/v1/support/contact-us', json({ body: JSON.stringify(body) })));

    const forwarded = api.upstreamRequest();

    expect(await forwarded.json()).toEqual(body);
    expect(forwarded.headers.get('content-type')).toBe('application/json');
  });

  it('returns the upstream status and body unchanged', async () => {
    serve({ status: 200, body: { id: 'user-1', email: 'member@example.com' } });

    const response = await GET(fromBrowser('/api/v1/user/me'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: 'user-1', email: 'member@example.com' });
  });

  it("returns the API's refusal under the API's own status", async () => {
    const envelope = { error: { message: 'Nope.', errorCode: 'USER_NOT_FOUND', code: 'NOT_FOUND' } };
    serve({ status: 404, body: envelope });

    const response = await GET(fromBrowser('/api/v1/user/me'));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual(envelope);
  });

  it('passes no Set-Cookie from the API back to the browser', async () => {
    serve({ headers: { 'set-cookie': 'backend_session=1; Path=/' } });

    const response = await GET(fromBrowser('/api/v1/user/me'));

    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('returns no response header but the content type', async () => {
    serve({ headers: { 'x-backend-instance': 'api-7', 'cache-control': 'no-store' } });

    const response = await GET(fromBrowser('/api/v1/user/me'));

    expect([...response.headers.keys()]).toEqual(['content-type']);
    expect(response.headers.get('content-type')).toBe('application/json');
  });

  it('refuses a body that is not valid JSON, without calling the API', async () => {
    const api = serve();

    const response = await POST(fromBrowser('/api/v1/support/contact-us', json({ body: 'not json' })));

    expect(response.status).toBe(400);
    expect(api.calls()).toBe(0);
  });
});
