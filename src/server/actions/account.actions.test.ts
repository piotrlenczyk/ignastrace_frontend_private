import { unsealData } from 'iron-session';
import { DEFAULT_SERVER_ERROR_MESSAGE } from 'next-safe-action';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { isEmailTakenActionError } from '@/server/lib/auth-action-error';
import { isHttpClientActionError } from '@/server/lib/safe-action';

import { SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from '../session/session.constants';
import type { SessionData } from '../session/session.types';

const API = 'https://api.ignastrace.test';

const SESSION_PASSWORD = 'a-test-sealing-password-of-at-least-32-characters';

vi.stubEnv('SESSION_PASSWORD', SESSION_PASSWORD);
vi.stubEnv('API_BASE_URL', API);

/*
 * The account writes, driven the way the settings form drives them: an input in,
 * an action result out. What this seam is for is the promises a screen depends on
 * and cannot see from inside a mutation — that the password is verified before
 * anything is saved, that a refusal arrives carrying the API's own code, and that
 * a changed address reaches the sealed session.
 *
 * The substitutions are the same three the session actions test makes, all of
 * them framework boundaries: `fetch`, the request's cookie jar, and the router.
 * iron-session seals for real, and the requests asserted on are the ones that
 * left the process.
 */
const upstreamRequests: Request[] = [];

let respond: (request: Request) => Promise<Response> = async (request) => {
  throw new Error(`Unexpected request to ${request.url}`);
};

/** Substituted once for the file: the generated client captures `fetch` on creation. */
vi.stubGlobal('fetch', async (request: Request) => {
  upstreamRequests.push(request);

  return respond(request);
});

type Entry = { value: string; options: Record<string, unknown> };

const createCookieJar = () => {
  const jar = new Map<string, Entry>();

  return {
    get: (name: string) => {
      const entry = jar.get(name);

      return entry ? { name, value: entry.value } : undefined;
    },
    set: (name: string, value: string, options: Record<string, unknown> = {}) => {
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

const REDIRECTED = 'NEXT_REDIRECT';

const redirect = vi.fn((path: string) => {
  throw new Error(`${REDIRECTED}: ${path}`);
});

vi.doMock('next/headers', () => ({ cookies: async () => cookieJar }));
vi.doMock('next/cache', () => ({ revalidatePath }));
vi.doMock('next/navigation', () => ({ redirect }));

/** Imported after the environment, the network and the framework modules are in place. */
const { actionDeleteAccount, actionUpdateAccount } = await import('./account.actions');
const { actionSignIn } = await import('./auth.actions');
const { getServerSession } = await import('../session/session.utils');

const accessToken = (claims: Record<string, unknown>) => {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(claims)}.signature`;
};

const IN_A_DAY = Math.floor(Date.now() / 1000) + 60 * 60 * 24;

const TOKEN_PAIR = {
  token: accessToken({
    id: 'user-1',
    email: 'member@example.com',
    type: 'USER',
    roles: ['STANDARD_USER'],
    exp: IN_A_DAY,
  }),
  refreshToken: 'refresh-1',
};

type Route = { status: number; body?: unknown };

const serveApi = (routes: Record<string, Route>) => {
  upstreamRequests.length = 0;

  respond = async (request) => {
    const path = Object.keys(routes).find((candidate) => new URL(request.url).pathname === candidate);

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
    /** The paths the API was called on, in the order it was called on them. */
    paths: () => upstreamRequests.map((request) => new URL(request.url).pathname),
    request: (path: string) => {
      const request = upstreamRequests.find((candidate) => new URL(candidate.url).pathname === path);

      if (!request) {
        throw new Error(`The API was not called on ${path}.`);
      }

      return request;
    },
  };
};

const PROFILE_PATH = '/api/v1/user';
const PASSWORD_PATH = '/api/v1/user/me/password';
const DELETE_PATH = '/api/v1/user/me/delete';
const LOGIN_PATH = '/api/v1/auth/login';

const OK: Route = { status: 200 };

/** The API's error envelope, as every refusal the specification declares arrives. */
const refusal = (errorCode: string, code: string, message: string) => ({ error: { errorCode, code, message } });

const sealedSession = async (): Promise<SessionData> =>
  unsealData<SessionData>(cookieJar.entry(SESSION_COOKIE_NAME)!.value, {
    password: SESSION_PASSWORD,
    ttl: SESSION_TTL_SECONDS,
  });

/** The jar a successful sign-in would have left behind. */
const signedIn = async () => {
  serveApi({ [LOGIN_PATH]: { status: 201, body: TOKEN_PAIR } });

  await actionSignIn({ email: 'member@example.com', password: 'secret' });
};

const PROFILE = { name: 'Jane Member', email: 'member@example.com' };

const PASSWORD_CHANGE = { currentPassword: 'OldPassword123!', newPassword: 'NewStrongPass123!' };

beforeEach(async () => {
  cookieJar = createCookieJar();
  revalidatePath.mockClear();
  redirect.mockClear();
  await signedIn();
});

describe('updateAccount', () => {
  it('sends the profile to the update endpoint as the specification declares it', async () => {
    const api = serveApi({ [PROFILE_PATH]: OK });

    const { serverError } = await actionUpdateAccount(PROFILE);
    const upstream = api.request(PROFILE_PATH);

    expect(serverError).toBeUndefined();
    expect(upstream.method).toBe('PUT');
    expect(await upstream.json()).toEqual({ name: 'Jane Member', email: 'member@example.com' });
  });

  it('leaves the password endpoint alone when the member changed no password', async () => {
    const api = serveApi({ [PROFILE_PATH]: OK });

    await actionUpdateAccount(PROFILE);

    expect(api.paths()).toEqual([PROFILE_PATH]);
  });

  it('verifies the current password before it saves anything', async () => {
    const api = serveApi({ [PASSWORD_PATH]: OK, [PROFILE_PATH]: OK });

    await actionUpdateAccount({ ...PROFILE, ...PASSWORD_CHANGE });

    expect(api.paths()).toEqual([PASSWORD_PATH, PROFILE_PATH]);
    expect(await api.request(PASSWORD_PATH).json()).toEqual({
      oldPassword: 'OldPassword123!',
      newPassword: 'NewStrongPass123!',
    });
  });

  it('saves nothing at all when the current password is refused', async () => {
    const api = serveApi({
      [PASSWORD_PATH]: { status: 401, body: refusal('CREDENTIALS_ERROR', 'UNAUTHORIZED', 'Invalid credentials') },
    });

    const { serverError } = await actionUpdateAccount({ ...PROFILE, email: 'renamed@example.com', ...PASSWORD_CHANGE });

    expect(serverError).toMatchObject({ status: 401, data: { errorCode: 'CREDENTIALS_ERROR' } });
    expect(isHttpClientActionError(serverError)).toBe(true);
    expect(api.paths()).toEqual([PASSWORD_PATH]);
    expect((await sealedSession()).user.email).toBe('member@example.com');
  });

  it('reports a failure when the password changed but the profile update was refused', async () => {
    serveApi({
      [PASSWORD_PATH]: OK,
      [PROFILE_PATH]: { status: 409, body: refusal('EMAIL_EXISTS_ERROR', 'CONFLICT', 'Email already exists') },
    });

    const { serverError, data } = await actionUpdateAccount({
      ...PROFILE,
      email: 'taken@example.com',
      ...PASSWORD_CHANGE,
    });

    expect(data).toBeUndefined();
    expect(isEmailTakenActionError(serverError)).toBe(true);
    expect((await sealedSession()).user.email).toBe('member@example.com');
  });

  it('points a taken address at the form by carrying the API’s conflict code', async () => {
    serveApi({
      [PROFILE_PATH]: { status: 409, body: refusal('USER_EXISTS_ERROR', 'CONFLICT', 'User already exists') },
    });

    const { serverError } = await actionUpdateAccount({ ...PROFILE, email: 'taken@example.com' });

    expect(isEmailTakenActionError(serverError)).toBe(true);
  });

  it('rewrites the session’s address on success, leaving the token pair as it was', async () => {
    serveApi({ [PROFILE_PATH]: OK });

    await actionUpdateAccount({ ...PROFILE, email: 'renamed@example.com' });

    expect(await sealedSession()).toEqual({
      isLoggedIn: true,
      accessToken: TOKEN_PAIR.token,
      accessTokenExpiresAt: IN_A_DAY * 1000,
      refreshToken: 'refresh-1',
      user: { id: 'user-1', email: 'renamed@example.com', type: 'USER', roles: ['STANDARD_USER'] },
    });
  });

  it('leaves a guest’s refusal for the generic message rather than attributing it to a field', async () => {
    serveApi({
      [PROFILE_PATH]: { status: 403, body: refusal('NOT_PERMITTED_ERROR', 'FORBIDDEN', 'Guest users cannot update') },
    });

    const { serverError } = await actionUpdateAccount(PROFILE);

    expect(isHttpClientActionError(serverError)).toBe(true);
    expect(isEmailTakenActionError(serverError)).toBe(false);
    expect(serverError).toMatchObject({ status: 403, data: { errorCode: 'NOT_PERMITTED_ERROR' } });
  });

  it('answers with the default server error when the refusal is not one the API described', async () => {
    serveApi({ [PROFILE_PATH]: { status: 502, body: '<html>Bad gateway</html>' } });

    const { serverError } = await actionUpdateAccount(PROFILE);

    expect(serverError).toBe(DEFAULT_SERVER_ERROR_MESSAGE);
  });

  it('refuses a half-stated password change without calling the API', async () => {
    const api = serveApi({});

    const { validationErrors } = await actionUpdateAccount({ ...PROFILE, newPassword: 'NewStrongPass123!' });

    expect(validationErrors).toBeDefined();
    expect(api.paths()).toEqual([]);
  });
});

describe('deleteAccount', () => {
  it('deletes the account and destroys the session, without sending the member anywhere', async () => {
    const api = serveApi({ [DELETE_PATH]: { status: 200, body: { status: 'ok' } } });

    const { serverError } = await actionDeleteAccount();

    expect(serverError).toBeUndefined();
    expect(api.paths()).toEqual([DELETE_PATH]);
    expect(api.request(DELETE_PATH).method).toBe('DELETE');
    expect(await getServerSession()).toBeNull();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('keeps the session when the API refuses, so nothing is lost on a failed attempt', async () => {
    serveApi({
      [DELETE_PATH]: { status: 403, body: refusal('NOT_PERMITTED_ERROR', 'FORBIDDEN', 'Guest users cannot delete') },
    });

    const { serverError } = await actionDeleteAccount();

    expect(serverError).toMatchObject({ status: 403, data: { errorCode: 'NOT_PERMITTED_ERROR' } });
    expect(await getServerSession()).not.toBeNull();
  });
});
