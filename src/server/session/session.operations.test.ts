import { unsealData } from 'iron-session';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  ACCESS_TOKEN_COOKIE_NAME,
  getSessionPassword,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
} from './session.constants';
import type { SessionCookieWriter } from './session.cookies';
import { performRegistration, performSignIn, performSignOut } from './session.operations';
import type { SessionData } from './session.types';

const API = 'https://api.ignastrace.test';

const SESSION_PASSWORD = 'a-test-sealing-password-of-at-least-32-characters';

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

/** Serves the new API's auth endpoints; every other URL is a test failure. */
const serveApi = (routes: Record<string, Route>) => {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const path = Object.keys(routes).find((candidate) => url.endsWith(candidate));

    if (!path) {
      throw new Error(`Unexpected request to ${url}`);
    }

    const { status, body } = routes[path] as Route;

    return new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  });

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
};

const sealedSession = async (jar: ReturnType<typeof createCookieJar>): Promise<SessionData> =>
  unsealData<SessionData>(jar.entry(SESSION_COOKIE_NAME)!.value, {
    password: getSessionPassword(),
    ttl: SESSION_TTL_SECONDS,
  });

beforeAll(() => {
  vi.stubEnv('SESSION_PASSWORD', SESSION_PASSWORD);
  vi.stubEnv('API_BASE_URL', API);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('performSignIn', () => {
  it('writes both cookies when the API accepts the credentials', async () => {
    const jar = createCookieJar();
    serveApi({
      '/api/v1/auth/login': { status: 201, body: { token: accessToken(FULL_CLAIMS), refreshToken: 'refresh-1' } },
    });

    const result = await performSignIn(jar, { email: 'member@example.com', password: 'secret' });

    expect(result).toEqual({ success: true });
    expect(jar.names()).toEqual([ACCESS_TOKEN_COOKIE_NAME, SESSION_COOKIE_NAME].sort());
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

  it('keeps the sealed cookie http-only and leaves the token cookie readable', async () => {
    const jar = createCookieJar();
    serveApi({
      '/api/v1/auth/login': { status: 201, body: { token: accessToken(FULL_CLAIMS), refreshToken: 'refresh-1' } },
    });

    await performSignIn(jar, { email: 'member@example.com', password: 'secret' });

    expect(jar.entry(SESSION_COOKIE_NAME)?.options).toMatchObject({ httpOnly: true, sameSite: 'lax', path: '/' });
    expect(jar.entry(ACCESS_TOKEN_COOKIE_NAME)?.options).toMatchObject({
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      expires: new Date(IN_A_DAY * 1000),
    });
  });

  it('exposes the raw access token in the companion cookie', async () => {
    const jar = createCookieJar();
    const token = accessToken(FULL_CLAIMS);
    serveApi({ '/api/v1/auth/login': { status: 201, body: { token, refreshToken: 'refresh-1' } } });

    await performSignIn(jar, { email: 'member@example.com', password: 'secret' });

    expect(jar.entry(ACCESS_TOKEN_COOKIE_NAME)?.value).toBe(token);
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

  it('leaves no session behind when the credentials are refused', async () => {
    const jar = createCookieJar();
    serveApi({ '/api/v1/auth/login': { status: 401, body: { message: 'Unauthorized' } } });

    const result = await performSignIn(jar, { email: 'member@example.com', password: 'wrong' });

    expect(result).toEqual({ success: false, error: 'invalid_credentials' });
    expect(jar.names()).toEqual([]);
  });

  it('leaves no session behind when the API is unavailable', async () => {
    const jar = createCookieJar();
    serveApi({ '/api/v1/auth/login': { status: 500, body: { message: 'Server error' } } });

    const result = await performSignIn(jar, { email: 'member@example.com', password: 'secret' });

    expect(result).toEqual({ success: false, error: 'unavailable' });
    expect(jar.names()).toEqual([]);
  });
});

describe('performRegistration', () => {
  it('writes both cookies, so the new account continues into the app signed in', async () => {
    const jar = createCookieJar();
    const token = accessToken(FULL_CLAIMS);
    serveApi({ '/api/v1/auth/register': { status: 201, body: { token, refreshToken: 'refresh-1' } } });

    const result = await performRegistration(jar, { email: 'new@example.com' });

    expect(result).toEqual({ success: true });
    expect(jar.names()).toEqual([ACCESS_TOKEN_COOKIE_NAME, SESSION_COOKIE_NAME].sort());
    expect(jar.entry(ACCESS_TOKEN_COOKIE_NAME)?.value).toBe(token);
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

    expect(api).toHaveBeenCalledWith(
      `${API}/api/v1/auth/register`,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-locale': 'es' },
        body: JSON.stringify({ email: 'new@example.com' }),
      }),
    );
  });

  it('reports a taken email address without leaving a session behind', async () => {
    const jar = createCookieJar();
    serveApi({ '/api/v1/auth/register': { status: 409, body: { message: 'User already exists' } } });

    const result = await performRegistration(jar, { email: 'member@example.com' });

    expect(result).toEqual({ success: false, error: 'email_taken' });
    expect(jar.names()).toEqual([]);
  });

  it('leaves no session behind when the API is unavailable', async () => {
    const jar = createCookieJar();
    serveApi({ '/api/v1/auth/register': { status: 500, body: { message: 'Server error' } } });

    const result = await performRegistration(jar, { email: 'new@example.com' });

    expect(result).toEqual({ success: false, error: 'unavailable' });
    expect(jar.names()).toEqual([]);
  });

  it('leaves no session behind when the account cannot be identified', async () => {
    const jar = createCookieJar();
    serveApi({
      '/api/v1/auth/register': { status: 201, body: { token: accessToken({ exp: IN_A_DAY }), refreshToken: 'r' } },
      '/api/v1/user/me': { status: 500, body: { message: 'Server error' } },
    });

    const result = await performRegistration(jar, { email: 'new@example.com' });

    expect(result).toEqual({ success: false, error: 'unavailable' });
    expect(jar.names()).toEqual([]);
  });
});

describe('performSignOut', () => {
  const signedIn = async (jar: ReturnType<typeof createCookieJar>) => {
    serveApi({
      '/api/v1/auth/login': { status: 201, body: { token: accessToken(FULL_CLAIMS), refreshToken: 'refresh-1' } },
    });
    await performSignIn(jar, { email: 'member@example.com', password: 'secret' });
  };

  it('clears both cookies and revokes the token upstream', async () => {
    const jar = createCookieJar();
    await signedIn(jar);

    const api = serveApi({ '/api/v1/auth/logout': { status: 201 } });
    await performSignOut(jar);

    expect(jar.names()).toEqual([]);
    expect(api).toHaveBeenCalledWith(
      `${API}/api/v1/auth/logout`,
      expect.objectContaining({ method: 'POST', headers: { Authorization: `Bearer ${accessToken(FULL_CLAIMS)}` } }),
    );
  });

  it('clears both cookies even when the revocation fails', async () => {
    const jar = createCookieJar();
    await signedIn(jar);

    serveApi({ '/api/v1/auth/logout': { status: 500, body: { message: 'Server error' } } });
    await performSignOut(jar);

    expect(jar.names()).toEqual([]);
  });

  it('clears both cookies when the network call throws', async () => {
    const jar = createCookieJar();
    await signedIn(jar);

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('Network down');
      }),
    );
    await performSignOut(jar);

    expect(jar.names()).toEqual([]);
  });

  it('is a no-op that still leaves no cookies for a visitor who was never signed in', async () => {
    const jar = createCookieJar();
    const api = serveApi({});

    await performSignOut(jar);

    expect(jar.names()).toEqual([]);
    expect(api).not.toHaveBeenCalled();
  });
});
