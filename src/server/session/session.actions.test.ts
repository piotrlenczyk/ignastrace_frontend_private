import { unsealData } from 'iron-session';
import { DEFAULT_SERVER_ERROR_MESSAGE } from 'next-safe-action';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { isEmailTakenActionError } from '@/server/lib/auth-action-error';
import { isHttpClientActionError } from '@/server/lib/safe-action';

import { getSessionPassword, SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from './session.constants';
import type { SessionData } from './session.types';

const API = 'https://api.ignastrace.test';

const SESSION_PASSWORD = 'a-test-sealing-password-of-at-least-32-characters';

vi.stubEnv('SESSION_PASSWORD', SESSION_PASSWORD);
vi.stubEnv('API_BASE_URL', API);

/*
 * The actions, driven the way a form drives them: an input in, an action result
 * out. This is the lowest seam at which what this layer promises is visible —
 * that a refusal arrives as a structured action error carrying the API's own
 * envelope, and that anything else arrives as the library's default message.
 *
 * Two things are substituted, both framework boundaries rather than anything of
 * this application's: the request's cookie jar, and the cache invalidation the
 * actions ask for. The network is stubbed at `fetch`, so the request the API
 * would have received is a real one.
 */
const upstreamRequests: Request[] = [];

let respond: (request: Request) => Promise<Response> = async (request) => {
  throw new Error(`Unexpected request to ${request.url}`);
};

/*
 * Substituted once and for the whole file: the generated client the auth calls
 * go through captures `globalThis.fetch` when it is created, so a stub installed
 * later would never be the one it calls.
 */
vi.stubGlobal('fetch', async (request: Request) => {
  upstreamRequests.push(request);

  return respond(request);
});

/**
 * A cookie jar with the surface `cookies()` hands a server action, standing in
 * for the request's. Nothing else about the session is substituted.
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
  };
};

let cookieJar = createCookieJar();

const revalidatePath = vi.fn();

vi.doMock('next/headers', () => ({ cookies: async () => cookieJar }));
vi.doMock('next/cache', () => ({ revalidatePath }));

/*
 * Imported after the environment, the network and the two framework modules are
 * in place: the client reads the API's base URL and captures `fetch` the first
 * time its module runs, and `.env` is not in the repository.
 */
const { register, signIn, signOut, updateSessionEmail } = await import('./session.actions');

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

const TOKEN_PAIR = { token: accessToken(FULL_CLAIMS), refreshToken: 'refresh-1' };

const CREDENTIALS = { email: 'member@example.com', password: 'secret' };

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

const sealedSession = async (): Promise<SessionData> =>
  unsealData<SessionData>(cookieJar.entry(SESSION_COOKIE_NAME)!.value, {
    password: getSessionPassword(),
    ttl: SESSION_TTL_SECONDS,
  });

/** The jar a successful sign-in would have left behind. */
const signedIn = async () => {
  serveApi({ '/api/v1/auth/login': { status: 201, body: TOKEN_PAIR } });

  await signIn(CREDENTIALS);
};

beforeEach(() => {
  cookieJar = createCookieJar();
  revalidatePath.mockClear();
  serveApi({});
});

describe('signIn', () => {
  it('seals the token pair and the identity into the session cookie', async () => {
    serveApi({ '/api/v1/auth/login': { status: 201, body: TOKEN_PAIR } });

    const result = await signIn(CREDENTIALS);

    expect(result.serverError).toBeUndefined();
    expect(cookieJar.names()).toEqual([SESSION_COOKIE_NAME]);
    expect(await sealedSession()).toEqual({
      isLoggedIn: true,
      accessToken: TOKEN_PAIR.token,
      accessTokenExpiresAt: IN_A_DAY * 1000,
      refreshToken: 'refresh-1',
      user: { id: 'user-1', email: 'member@example.com', type: 'USER', roles: ['STANDARD_USER'] },
    });
  });

  it('keeps the session cookie http-only, so no page script can read the token pair', async () => {
    serveApi({ '/api/v1/auth/login': { status: 201, body: TOKEN_PAIR } });

    await signIn(CREDENTIALS);

    expect(cookieJar.entry(SESSION_COOKIE_NAME)?.options).toMatchObject({
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });
  });

  it('sends the credentials to the API as the specification declares them', async () => {
    const api = serveApi({ '/api/v1/auth/login': { status: 201, body: TOKEN_PAIR } });

    await signIn(CREDENTIALS);
    const upstream = api.upstreamRequest();

    expect(upstream.url).toBe(`${API}/api/v1/auth/login`);
    expect(upstream.method).toBe('POST');
    expect(await upstream.json()).toEqual(CREDENTIALS);
  });

  it('invalidates the layout that renders the session, so the tree stops describing a visitor', async () => {
    serveApi({ '/api/v1/auth/login': { status: 201, body: TOKEN_PAIR } });

    await signIn(CREDENTIALS);

    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
  });

  it('surfaces refused credentials as a structured action error carrying the API’s code', async () => {
    serveApi({
      '/api/v1/auth/login': { status: 401, body: refusal('CREDENTIALS_ERROR', 'UNAUTHORIZED', 'Invalid credentials') },
    });

    const { serverError } = await signIn({ ...CREDENTIALS, password: 'wrong' });

    expect(isHttpClientActionError(serverError)).toBe(true);
    expect(serverError).toMatchObject({ status: 401, data: { errorCode: 'CREDENTIALS_ERROR', code: 'UNAUTHORIZED' } });
    expect(cookieJar.names()).toEqual([]);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('surfaces a missing account the same structured way, leaving the form to say one thing to both', async () => {
    serveApi({
      '/api/v1/auth/login': {
        status: 404,
        body: refusal('USER_DOES_NOT_EXIST_ERROR', 'NOT_FOUND', 'No such user'),
      },
    });

    const { serverError } = await signIn(CREDENTIALS);

    expect(serverError).toMatchObject({ status: 404, data: { errorCode: 'USER_DOES_NOT_EXIST_ERROR' } });
  });

  it('answers with the default server error when the pair cannot be turned into a session', async () => {
    serveApi({
      '/api/v1/auth/login': { status: 201, body: { token: accessToken({ exp: IN_A_DAY }), refreshToken: 'refresh-1' } },
      '/api/v1/user/me': {
        status: 500,
        body: refusal('INTERNAL_SERVER_ERROR', 'INTERNAL_SERVER_ERROR', 'Server error'),
      },
    });

    const { serverError } = await signIn(CREDENTIALS);

    expect(serverError).toBe(DEFAULT_SERVER_ERROR_MESSAGE);
    expect(cookieJar.names()).toEqual([]);
  });

  it('answers with the default server error when the refusal is not one the API described', async () => {
    serveApi({ '/api/v1/auth/login': { status: 502, body: '<html>Bad gateway</html>' } });

    const { serverError } = await signIn(CREDENTIALS);

    expect(serverError).toBe(DEFAULT_SERVER_ERROR_MESSAGE);
    expect(cookieJar.names()).toEqual([]);
  });

  it('refuses an input the schema rejects without calling the API', async () => {
    const api = serveApi({});

    const { validationErrors, serverError } = await signIn({ email: 'not-an-address', password: '' });

    expect(validationErrors).toBeDefined();
    expect(serverError).toBeUndefined();
    expect(api.calls()).toBe(0);
  });
});

describe('register', () => {
  it('seals the session the API issued, so the new account continues into the app signed in', async () => {
    serveApi({ '/api/v1/auth/register': { status: 201, body: TOKEN_PAIR } });

    const result = await register({ email: 'member@example.com' });

    expect(result.serverError).toBeUndefined();
    expect(cookieJar.names()).toEqual([SESSION_COOKIE_NAME]);
    expect((await sealedSession()).accessToken).toBe(TOKEN_PAIR.token);
  });

  it('asks the API for the account in the visitor’s language', async () => {
    const api = serveApi({ '/api/v1/auth/register': { status: 201, body: TOKEN_PAIR } });

    await register({ email: 'new@example.com', locale: 'es' });
    const upstream = api.upstreamRequest();

    expect(upstream.url).toBe(`${API}/api/v1/auth/register`);
    expect(upstream.headers.get('x-locale')).toBe('es');
    expect(await upstream.json()).toEqual({ email: 'new@example.com' });
  });

  it('surfaces the conflict code the specification declares for an address already registered', async () => {
    serveApi({
      '/api/v1/auth/register': { status: 409, body: refusal('USER_EXISTS_ERROR', 'CONFLICT', 'User already exists') },
    });

    const { serverError } = await register({ email: 'member@example.com' });

    expect(serverError).toMatchObject({ status: 409, data: { errorCode: 'USER_EXISTS_ERROR', code: 'CONFLICT' } });
    expect(isEmailTakenActionError(serverError)).toBe(true);
    expect(cookieJar.names()).toEqual([]);
  });

  it('reads the enumeration’s other name for the same conflict as a taken address too', async () => {
    serveApi({
      '/api/v1/auth/register': { status: 409, body: refusal('EMAIL_EXISTS_ERROR', 'CONFLICT', 'Email already exists') },
    });

    const { serverError } = await register({ email: 'member@example.com' });

    expect(isEmailTakenActionError(serverError)).toBe(true);
  });

  it('leaves every other refusal for the generic message, cookie unwritten', async () => {
    serveApi({
      '/api/v1/auth/register': {
        status: 500,
        body: refusal('INTERNAL_SERVER_ERROR', 'INTERNAL_SERVER_ERROR', 'Server error'),
      },
    });

    const { serverError } = await register({ email: 'new@example.com' });

    expect(isEmailTakenActionError(serverError)).toBe(false);
    expect(cookieJar.names()).toEqual([]);
  });
});

describe('updateSessionEmail', () => {
  it('records the new address without disturbing the tokens', async () => {
    await signedIn();

    await updateSessionEmail({ email: 'renamed@example.com' });

    expect(cookieJar.names()).toEqual([SESSION_COOKIE_NAME]);
    expect(await sealedSession()).toEqual({
      isLoggedIn: true,
      accessToken: TOKEN_PAIR.token,
      accessTokenExpiresAt: IN_A_DAY * 1000,
      refreshToken: 'refresh-1',
      user: { id: 'user-1', email: 'renamed@example.com', type: 'USER', roles: ['STANDARD_USER'] },
    });
  });

  it('mints no session for a visitor who has none', async () => {
    await updateSessionEmail({ email: 'renamed@example.com' });

    expect(cookieJar.names()).toEqual([]);
  });
});

describe('signOut', () => {
  it('clears the session cookie and revokes the token upstream', async () => {
    await signedIn();

    const api = serveApi({ '/api/v1/auth/logout': { status: 201 } });
    await signOut();
    const upstream = api.upstreamRequest();

    expect(cookieJar.names()).toEqual([]);
    expect(upstream.url).toBe(`${API}/api/v1/auth/logout`);
    expect(upstream.method).toBe('POST');
    expect(upstream.headers.get('authorization')).toBe(`Bearer ${TOKEN_PAIR.token}`);
  });

  it('clears it even when the revocation is refused, rather than leaving a half-signed-in visitor', async () => {
    await signedIn();

    serveApi({
      '/api/v1/auth/logout': {
        status: 500,
        body: refusal('INTERNAL_SERVER_ERROR', 'INTERNAL_SERVER_ERROR', 'Server error'),
      },
    });

    const { serverError } = await signOut();

    expect(serverError).toBeUndefined();
    expect(cookieJar.names()).toEqual([]);
  });

  it('clears it when the revocation call never reaches the API', async () => {
    await signedIn();

    respond = async () => {
      throw new Error('Network down');
    };

    await signOut();

    expect(cookieJar.names()).toEqual([]);
  });

  it('spends no request on a visitor who was never signed in', async () => {
    const api = serveApi({});

    await signOut();

    expect(cookieJar.names()).toEqual([]);
    expect(api.calls()).toBe(0);
  });
});
