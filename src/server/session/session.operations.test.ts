import { unsealData } from 'iron-session';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getSessionPassword, SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from './session.constants';
import type { SessionCookieWriter } from './session.cookies';
import type { SessionData } from './session.types';

const API = 'https://api.ignastrace.test';

const SESSION_PASSWORD = 'a-test-sealing-password-of-at-least-32-characters';

vi.stubEnv('SESSION_PASSWORD', SESSION_PASSWORD);
vi.stubEnv('API_BASE_URL', API);

/*
 * The network, substituted once and for the whole file rather than per test: the
 * generated client the auth calls go through captures `globalThis.fetch` when it
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
const { performEmailUpdate, performRegistration, performSignIn, performSignOut } = await import('./session.operations');

/*
 * A cookie jar with the same surface `cookies()` and `NextResponse.cookies`
 * offer, so the operations run against it unchanged. Nothing in the session
 * module is substituted here — only the network is.
 */
type Entry = { value: string; options: Record<string, unknown> };

const createCookieJar = () => {
  const jar = new Map<string, Entry>();

  return {
    get: (name: string) => {
      const entry = jar.get(name);

      return entry ? { value: entry.value } : undefined;
    },
    set: (name: string, value: string, options: Record<string, unknown>) => {
      jar.set(name, { value, options });
    },
    delete: (name: string) => {
      jar.delete(name);
    },
    entry: (name: string) => jar.get(name),
    names: () => [...jar.keys()].sort(),
  } satisfies SessionCookieWriter & Record<string, unknown>;
};

const accessToken = (claims: Record<string, unknown>) => {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(claims)}.signature`;
};

const IN_A_DAY = Math.floor(Date.now() / 1000) + 60 * 60 * 24;

const FULL_CLAIMS = {
  sub: 'user-1',
  email: 'member@example.com',
  type: 'USER',
  roles: ['STANDARD_USER'],
  exp: IN_A_DAY,
};

type Route = { status: number; body?: unknown };

/**
 * Serves the new API's auth endpoints; every other URL is a test failure.
 * Returns readers for the requests that actually left this process, so an
 * assertion is about the request the API was sent rather than about the
 * arguments a helper was called with.
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
    upstreamRequest: (path?: string) => {
      const request = path ? upstreamRequests.find((candidate) => candidate.url.endsWith(path)) : upstreamRequests[0];

      if (!request) {
        throw new Error(`The API was not called${path ? ` on ${path}` : ''}.`);
      }

      return request;
    },
    calls: () => upstreamRequests.length,
  };
};

/** The API's error envelope, as every refusal the specification declares arrives. */
const refusal = (errorCode: string, code: string, message: string) => ({ error: { errorCode, code, message } });

/** A jar holding the session a successful sign-in would have left in it. */
const signedIn = async (jar: ReturnType<typeof createCookieJar>) => {
  serveApi({
    '/api/v1/auth/login': { status: 201, body: { token: accessToken(FULL_CLAIMS), refreshToken: 'refresh-1' } },
  });

  await performSignIn(jar, { email: 'member@example.com', password: 'secret' });
};

const sealedSession = async (jar: ReturnType<typeof createCookieJar>): Promise<SessionData> =>
  unsealData<SessionData>(jar.entry(SESSION_COOKIE_NAME)!.value, {
    password: getSessionPassword(),
    ttl: SESSION_TTL_SECONDS,
  });

beforeEach(() => {
  serveApi({});
});

describe('performSignIn', () => {
  it('writes the session cookie when the API accepts the credentials', async () => {
    const jar = createCookieJar();
    serveApi({
      '/api/v1/auth/login': { status: 201, body: { token: accessToken(FULL_CLAIMS), refreshToken: 'refresh-1' } },
    });

    const result = await performSignIn(jar, { email: 'member@example.com', password: 'secret' });

    expect(result).toEqual({ success: true });
    expect(jar.names()).toEqual([SESSION_COOKIE_NAME]);
  });

  it('sends the credentials to the API as the specification declares them', async () => {
    const jar = createCookieJar();
    const api = serveApi({
      '/api/v1/auth/login': { status: 201, body: { token: accessToken(FULL_CLAIMS), refreshToken: 'refresh-1' } },
    });

    await performSignIn(jar, { email: 'member@example.com', password: 'secret' });
    const upstream = api.upstreamRequest();

    expect(upstream.url).toBe(`${API}/api/v1/auth/login`);
    expect(upstream.method).toBe('POST');
    expect(await upstream.json()).toEqual({ email: 'member@example.com', password: 'secret' });
  });

  it('seals the token pair and the identity into the session cookie', async () => {
    const jar = createCookieJar();
    const token = accessToken(FULL_CLAIMS);
    serveApi({ '/api/v1/auth/login': { status: 201, body: { token, refreshToken: 'refresh-1' } } });

    await performSignIn(jar, { email: 'member@example.com', password: 'secret' });

    expect(await sealedSession(jar)).toEqual({
      isLoggedIn: true,
      accessToken: token,
      accessTokenExpiresAt: IN_A_DAY * 1000,
      refreshToken: 'refresh-1',
      user: { id: 'user-1', email: 'member@example.com', type: 'USER', roles: ['STANDARD_USER'] },
    });
  });

  it('keeps the session cookie http-only, so no page script can read the token pair', async () => {
    const jar = createCookieJar();
    serveApi({
      '/api/v1/auth/login': { status: 201, body: { token: accessToken(FULL_CLAIMS), refreshToken: 'refresh-1' } },
    });

    await performSignIn(jar, { email: 'member@example.com', password: 'secret' });

    expect(jar.entry(SESSION_COOKIE_NAME)?.options).toMatchObject({ httpOnly: true, sameSite: 'lax', path: '/' });
  });

  it('fills identity the token does not carry from the current-user endpoint', async () => {
    const jar = createCookieJar();
    serveApi({
      '/api/v1/auth/login': { status: 201, body: { token: accessToken({ exp: IN_A_DAY }), refreshToken: 'refresh-1' } },
      '/api/v1/user/me': {
        status: 200,
        body: { id: 'user-2', email: 'fetched@example.com', type: 'USER', roles: ['STANDARD_USER'] },
      },
    });

    await performSignIn(jar, { email: 'fetched@example.com', password: 'secret' });

    expect((await sealedSession(jar)).user).toEqual({
      id: 'user-2',
      email: 'fetched@example.com',
      type: 'USER',
      roles: ['STANDARD_USER'],
    });
  });

  it('presents the freshly issued token when it tops the identity up', async () => {
    const jar = createCookieJar();
    const token = accessToken({ exp: IN_A_DAY });
    const api = serveApi({
      '/api/v1/auth/login': { status: 201, body: { token, refreshToken: 'refresh-1' } },
      '/api/v1/user/me': { status: 200, body: { id: 'user-2', type: 'USER' } },
    });

    await performSignIn(jar, { email: 'fetched@example.com', password: 'secret' });

    expect(api.upstreamRequest('/api/v1/user/me').headers.get('authorization')).toBe(`Bearer ${token}`);
  });

  it('leaves no session behind when the credentials are refused', async () => {
    const jar = createCookieJar();
    serveApi({
      '/api/v1/auth/login': { status: 401, body: refusal('CREDENTIALS_ERROR', 'UNAUTHORIZED', 'Invalid credentials') },
    });

    const result = await performSignIn(jar, { email: 'member@example.com', password: 'wrong' });

    expect(result).toEqual({ success: false, error: 'invalid_credentials' });
    expect(jar.names()).toEqual([]);
  });

  it('leaves no session behind when the API is unavailable', async () => {
    const jar = createCookieJar();
    serveApi({
      '/api/v1/auth/login': {
        status: 500,
        body: refusal('INTERNAL_SERVER_ERROR', 'INTERNAL_SERVER_ERROR', 'Server error'),
      },
    });

    const result = await performSignIn(jar, { email: 'member@example.com', password: 'secret' });

    expect(result).toEqual({ success: false, error: 'unavailable' });
    expect(jar.names()).toEqual([]);
  });

  it('reports unavailability when the refusal is not one the API described', async () => {
    const jar = createCookieJar();
    serveApi({ '/api/v1/auth/login': { status: 502, body: '<html>Bad gateway</html>' } });

    const result = await performSignIn(jar, { email: 'member@example.com', password: 'secret' });

    expect(result).toEqual({ success: false, error: 'unavailable' });
    expect(jar.names()).toEqual([]);
  });
});

describe('performRegistration', () => {
  it('writes the session cookie, so the new account continues into the app signed in', async () => {
    const jar = createCookieJar();
    const token = accessToken(FULL_CLAIMS);
    serveApi({ '/api/v1/auth/register': { status: 201, body: { token, refreshToken: 'refresh-1' } } });

    const result = await performRegistration(jar, { email: 'new@example.com' });

    expect(result).toEqual({ success: true });
    expect(jar.names()).toEqual([SESSION_COOKIE_NAME]);
    expect((await sealedSession(jar)).accessToken).toBe(token);
  });

  it('seals the same session sign-in would have sealed', async () => {
    const jar = createCookieJar();
    const token = accessToken(FULL_CLAIMS);
    serveApi({ '/api/v1/auth/register': { status: 201, body: { token, refreshToken: 'refresh-1' } } });

    await performRegistration(jar, { email: 'new@example.com' });

    expect(await sealedSession(jar)).toEqual({
      isLoggedIn: true,
      accessToken: token,
      accessTokenExpiresAt: IN_A_DAY * 1000,
      refreshToken: 'refresh-1',
      user: { id: 'user-1', email: 'member@example.com', type: 'USER', roles: ['STANDARD_USER'] },
    });
  });

  it('asks the API for the account in the visitor’s language', async () => {
    const jar = createCookieJar();
    const api = serveApi({
      '/api/v1/auth/register': { status: 201, body: { token: accessToken(FULL_CLAIMS), refreshToken: 'refresh-1' } },
    });

    await performRegistration(jar, { email: 'new@example.com', locale: 'es' });
    const upstream = api.upstreamRequest();

    expect(upstream.url).toBe(`${API}/api/v1/auth/register`);
    expect(upstream.method).toBe('POST');
    expect(upstream.headers.get('x-locale')).toBe('es');
    expect(await upstream.json()).toEqual({ email: 'new@example.com' });
  });

  it('reports a taken email address without leaving a session behind', async () => {
    const jar = createCookieJar();
    serveApi({
      '/api/v1/auth/register': {
        status: 409,
        body: refusal('EMAIL_EXISTS_ERROR', 'CONFLICT', 'User already exists'),
      },
    });

    const result = await performRegistration(jar, { email: 'member@example.com' });

    expect(result).toEqual({ success: false, error: 'email_taken' });
    expect(jar.names()).toEqual([]);
  });

  it('leaves no session behind when the API is unavailable', async () => {
    const jar = createCookieJar();
    serveApi({
      '/api/v1/auth/register': {
        status: 500,
        body: refusal('INTERNAL_SERVER_ERROR', 'INTERNAL_SERVER_ERROR', 'Server error'),
      },
    });

    const result = await performRegistration(jar, { email: 'new@example.com' });

    expect(result).toEqual({ success: false, error: 'unavailable' });
    expect(jar.names()).toEqual([]);
  });

  it('leaves no session behind when the account cannot be identified', async () => {
    const jar = createCookieJar();
    serveApi({
      '/api/v1/auth/register': { status: 201, body: { token: accessToken({ exp: IN_A_DAY }), refreshToken: 'r' } },
      '/api/v1/user/me': {
        status: 500,
        body: refusal('INTERNAL_SERVER_ERROR', 'INTERNAL_SERVER_ERROR', 'Server error'),
      },
    });

    const result = await performRegistration(jar, { email: 'new@example.com' });

    expect(result).toEqual({ success: false, error: 'unavailable' });
    expect(jar.names()).toEqual([]);
  });
});

describe('performEmailUpdate', () => {
  it('records the new address without disturbing the tokens', async () => {
    const jar = createCookieJar();
    await signedIn(jar);

    await performEmailUpdate(jar, 'renamed@example.com');

    expect(await sealedSession(jar)).toEqual({
      isLoggedIn: true,
      accessToken: accessToken(FULL_CLAIMS),
      accessTokenExpiresAt: IN_A_DAY * 1000,
      refreshToken: 'refresh-1',
      user: { id: 'user-1', email: 'renamed@example.com', type: 'USER', roles: ['STANDARD_USER'] },
    });
  });

  it('leaves the member signed in, with the session cookie still in place', async () => {
    const jar = createCookieJar();
    await signedIn(jar);

    await performEmailUpdate(jar, 'renamed@example.com');

    expect(jar.names()).toEqual([SESSION_COOKIE_NAME]);
    expect((await sealedSession(jar)).accessToken).toBe(accessToken(FULL_CLAIMS));
  });

  it('does nothing for a visitor without a session, rather than minting one', async () => {
    const jar = createCookieJar();

    await performEmailUpdate(jar, 'renamed@example.com');

    expect(jar.names()).toEqual([]);
  });
});

describe('performSignOut', () => {
  it('clears the session cookie and revokes the token upstream', async () => {
    const jar = createCookieJar();
    await signedIn(jar);

    const api = serveApi({ '/api/v1/auth/logout': { status: 201 } });
    await performSignOut(jar);
    const upstream = api.upstreamRequest();

    expect(jar.names()).toEqual([]);
    expect(upstream.url).toBe(`${API}/api/v1/auth/logout`);
    expect(upstream.method).toBe('POST');
    expect(upstream.headers.get('authorization')).toBe(`Bearer ${accessToken(FULL_CLAIMS)}`);
  });

  it('clears it even when the revocation fails', async () => {
    const jar = createCookieJar();
    await signedIn(jar);

    serveApi({
      '/api/v1/auth/logout': {
        status: 500,
        body: refusal('INTERNAL_SERVER_ERROR', 'INTERNAL_SERVER_ERROR', 'Server error'),
      },
    });
    await performSignOut(jar);

    expect(jar.names()).toEqual([]);
  });

  it('clears it when the network call throws', async () => {
    const jar = createCookieJar();
    await signedIn(jar);

    respond = async () => {
      throw new Error('Network down');
    };
    await performSignOut(jar);

    expect(jar.names()).toEqual([]);
  });

  it('is a no-op that still leaves no cookies for a visitor who was never signed in', async () => {
    const jar = createCookieJar();
    const api = serveApi({});

    await performSignOut(jar);

    expect(jar.names()).toEqual([]);
    expect(api.calls()).toBe(0);
  });
});
