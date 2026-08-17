import { unsealData } from 'iron-session';
import { vi } from 'vitest';

import { SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from '@/server/session/session.constants';
import type { SessionData } from '@/server/session/session.types';

/*
 * The substitutions a server-side write test makes, in one place.
 *
 * Every one of them is a framework or platform boundary rather than anything of
 * this application's: `fetch`, the request's cookie jar, the cache invalidation
 * a write asks for, and the navigation it may perform. iron-session seals for
 * real, and the requests a test asserts on are the ones that left the process.
 *
 * Importing this module *is* installing them. That matters, because the
 * generated client reads the API's base URL and captures `globalThis.fetch` the
 * first time its module runs — so a test file imports this one statically, and
 * the module it drives with `await import(...)` after it.
 */

export const API = 'https://api.ignastrace.test';

export const SESSION_PASSWORD = 'a-test-sealing-password-of-at-least-32-characters';

vi.stubEnv('SESSION_PASSWORD', SESSION_PASSWORD);
vi.stubEnv('API_BASE_URL', API);

const upstreamRequests: Request[] = [];

let respond: (request: Request) => Promise<Response> = async (request) => {
  throw new Error(`Unexpected request to ${request.url}`);
};

/** Substituted once for the file, for the reason above. */
vi.stubGlobal('fetch', async (request: Request) => {
  upstreamRequests.push(request);

  return respond(request);
});

type Entry = { value: string; options: Record<string, unknown> };

const jar = new Map<string, Entry>();

/**
 * A cookie jar with the surface `cookies()` hands a server action, standing in
 * for the request's. Nothing else about the session is substituted —
 * iron-session writes into this through `getIronSession` exactly as it would in
 * a request.
 */
export const cookieJar = {
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
  clear: () => {
    jar.clear();
  },
};

export const revalidatePath = vi.fn();

/*
 * `redirect` interrupts a render by throwing, and a caller must not be able to
 * carry on past one — so the substitute throws too, rather than returning.
 *
 * What it throws carries a digest in Next's own format, because that digest is
 * how everything between a write and the framework tells a navigation apart from
 * a failure. next-safe-action is the case that matters here: without one it reads
 * a redirect as a server error and answers a successful write with a failure.
 */
export const REDIRECTED = 'NEXT_REDIRECT';

export const redirect = vi.fn((path: string) => {
  throw Object.assign(new Error(`${REDIRECTED}: ${path}`), {
    digest: `${REDIRECTED};replace;${path};303;`,
  });
});

vi.doMock('next/headers', () => ({ cookies: async () => cookieJar }));
vi.doMock('next/cache', () => ({ revalidatePath }));
vi.doMock('next/navigation', () => ({ redirect }));

export type Route = { status: number; body?: unknown };

export const OK: Route = { status: 200 };

/**
 * Serves a set of upstream routes; every other URL is a test failure. Returns
 * readers for the requests that actually left this process, so an assertion is
 * about the request the API was sent rather than about the arguments a helper
 * was called with.
 */
export const serveApi = (routes: Record<string, Route>) => {
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

/** The API's error envelope, as every refusal the specification declares arrives. */
export const refusal = (errorCode: string, code: string, message: string) => ({
  error: { errorCode, code, message },
});

export const sealedSession = async (): Promise<SessionData> =>
  unsealData<SessionData>(cookieJar.entry(SESSION_COOKIE_NAME)!.value, {
    password: SESSION_PASSWORD,
    ttl: SESSION_TTL_SECONDS,
  });

const accessToken = (claims: Record<string, unknown>) => {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(claims)}.signature`;
};

export const IN_A_DAY = Math.floor(Date.now() / 1000) + 60 * 60 * 24;

export const MEMBER_EMAIL = 'member@example.com';

export const TOKEN_PAIR = {
  token: accessToken({
    id: 'user-1',
    email: MEMBER_EMAIL,
    type: 'USER',
    roles: ['STANDARD_USER'],
    exp: IN_A_DAY,
  }),
  refreshToken: 'refresh-1',
};

const LOGIN_PATH = '/api/v1/auth/login';

/** Imported after the network and the framework modules are in place. */
const { actionSignIn } = await import('@/server/actions/auth.actions');

/** The jar a successful sign-in would have left behind. */
export const signedIn = async () => {
  serveApi({ [LOGIN_PATH]: { status: 201, body: TOKEN_PAIR } });

  await actionSignIn({ email: MEMBER_EMAIL, password: 'secret' });
};

/** Everything the substitutes carry between tests, put back to empty. */
export const resetKit = () => {
  cookieJar.clear();
  revalidatePath.mockClear();
  redirect.mockClear();
  serveApi({});
};
