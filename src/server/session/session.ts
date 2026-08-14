import { sealData, unsealData } from 'iron-session';
// Aliased: every operation below takes the cookie jar it works on as a
// parameter called `cookies`, and only the reader at the foot of the file wants
// the request's own.
import { cookies as requestCookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { ROUTES } from '@/constants/routes';
import type { components } from '@/network/api/api';
import { apiServerClient } from '@/network/api/apiServerClient';
import { unwrapApiResponse } from '@/network/http-response-handler';

import {
  ACCESS_TOKEN_EXPIRY_SKEW_MS,
  ACCESS_TOKEN_FALLBACK_TTL_SECONDS,
  getSessionPassword,
  SESSION_COOKIE_MAX_AGE_SECONDS,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  SESSION_TTL_SECONDS,
} from './session.constants';
import type { AccessTokenClaims, AccountType, SessionData, SessionUser } from './session.types';

/*
 * Everything that happens to a session: reading an access token's claims,
 * assembling an identity out of them, sealing and unsealing the one cookie that
 * carries it, the auth calls, and the operations that compose those into
 * sign-in, registration, renewal, an email change and sign-out.
 *
 * It is one module so that the answer to "what happens when someone signs in"
 * is one file rather than six. Three things sit outside it: the constants, the
 * data shapes, and the server actions — the last with its input schemas beside
 * it, because a `'use server'` module may export only async functions.
 *
 * Read as a whole it goes bottom-up: the token, then the session it describes,
 * then the cookie, then the API, then the operations, then the one reader the
 * rest of the application calls.
 *
 * Two consumers matter to how this is written. The server actions run in the
 * Node runtime with a request scope; the middleware runs without one, which is
 * why every operation is expressed against a cookie jar it is handed rather
 * than against `cookies()`. Only the reader at the foot of the file goes to
 * `cookies()` itself, and only the server side of the application calls it.
 */

/* ── The access token ─────────────────────────────────────────────────────── */

const ACCOUNT_TYPES: AccountType[] = ['GUEST', 'USER'];

const decodeBase64Url = (segment: string): string => {
  const padded = segment
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(segment.length / 4) * 4, '=');

  // `atob` rather than Buffer: this runs in the middleware runtime too.
  return atob(padded);
};

/**
 * Reads the claims out of an access token without verifying its signature.
 * Verification is the API's job — a token this application forged for itself
 * would buy it nothing, because every call still carries the token upstream.
 */
const decodeAccessToken = (token: string): AccessTokenClaims | null => {
  const payload = token.split('.')[1];

  if (!payload) {
    return null;
  }

  try {
    const claims: unknown = JSON.parse(decodeBase64Url(payload));

    return typeof claims === 'object' && claims !== null ? (claims as AccessTokenClaims) : null;
  } catch {
    return null;
  }
};

const asAccountType = (value: string | undefined): AccountType | undefined =>
  ACCOUNT_TYPES.find((type) => type === value);

/** The identity carried by the token, as far as the token happens to carry it. */
const readIdentityFromClaims = (claims: AccessTokenClaims | null): Partial<SessionUser> => {
  if (!claims) {
    return {};
  }

  const id = claims.sub ?? claims.id ?? claims.userId;
  const type = asAccountType(claims.type ?? claims.accountType);

  return {
    ...(id ? { id } : {}),
    ...(claims.email ? { email: claims.email } : {}),
    ...(type ? { type } : {}),
    ...(claims.roles ? { roles: claims.roles } : {}),
  };
};

/**
 * When the token carries an `exp`, that is the expiry. When it does not, the
 * API documents a 24-hour access token, so assume that rather than treat the
 * session as already expired.
 */
const readExpiryFromClaims = (claims: AccessTokenClaims | null, now: number): number =>
  typeof claims?.exp === 'number' ? claims.exp * 1000 : now + ACCESS_TOKEN_FALLBACK_TTL_SECONDS * 1000;

/**
 * Whether the access token has run out, counted a little early so that a clock
 * this application and the API disagree on cannot produce a request refused
 * for a token it believed was still good.
 */
export const isAccessTokenExpired = (session: SessionData, now = Date.now()): boolean =>
  session.accessTokenExpiresAt - ACCESS_TOKEN_EXPIRY_SKEW_MS <= now;

/* ── The session a token pair describes ───────────────────────────────────── */

export type TokenPair = {
  token: string;
  refreshToken: string;
};

const isComplete = (identity: Partial<SessionUser>): identity is SessionUser =>
  !!identity.id && !!identity.email && !!identity.type;

const completeIdentity = async (identity: Partial<SessionUser>, token: string): Promise<SessionUser | null> => {
  const currentUser = await requestCurrentUser(token);
  const id = identity.id ?? currentUser?.id;

  if (!id) {
    return null;
  }

  return {
    id,
    email: identity.email ?? currentUser?.email ?? undefined,
    type: identity.type ?? currentUser?.type,
    roles: identity.roles ?? currentUser?.roles,
  };
};

/**
 * Assembles the session that a token pair describes.
 *
 * The access token's claims are read first. Whatever identity they do not
 * carry is fetched from the current-user endpoint — once, here, at the point
 * the session is created, rather than on every request that reads it.
 *
 * Returns `null` when the token yields no user id even after that call, which
 * is the one case where there is nothing worth sealing.
 */
const createSession = async ({ token, refreshToken }: TokenPair, now = Date.now()): Promise<SessionData | null> => {
  const claims = decodeAccessToken(token);
  const identity = readIdentityFromClaims(claims);

  const user = isComplete(identity) ? identity : await completeIdentity(identity, token);

  if (!user) {
    return null;
  }

  return {
    isLoggedIn: true,
    accessToken: token,
    accessTokenExpiresAt: readExpiryFromClaims(claims, now),
    refreshToken,
    user,
  };
};

/**
 * The same session carrying a newly issued token pair.
 *
 * The identity is carried over rather than read back: a refresh returns
 * tokens, not a user, and asking the current-user endpoint who this is on
 * every expiry is exactly the per-request cost this session model set out to
 * avoid. A refresh does not change who the member is.
 */
const renewSessionTokens = (
  session: SessionData,
  { token, refreshToken }: TokenPair,
  now = Date.now(),
): SessionData => ({
  ...session,
  accessToken: token,
  accessTokenExpiresAt: readExpiryFromClaims(decodeAccessToken(token), now),
  refreshToken,
});

/**
 * Whether a session belongs to a full account. Guest-typed sessions exist in
 * the API's model and are carried here, but they are not admitted to the
 * member area — the guards treat them exactly as they treat no session at all.
 */
export const isFullUserSession = (session: SessionData | null): boolean => session?.user.type === 'USER';

/* ── The cookie that carries it ───────────────────────────────────────────── */

/*
 * The narrowest shape the session's reads and writes need from a cookie jar.
 * `cookies()` from next/headers and `NextResponse.cookies` both satisfy it,
 * which is what lets a server action and the middleware share one
 * implementation of them.
 */
export type SessionCookieReader = {
  get(name: string): { value: string } | undefined;
};

export type SessionCookieWriter = SessionCookieReader & {
  set(name: string, value: string, options: Record<string, unknown>): unknown;
  delete(name: string): unknown;
};

const isUsable = (session: SessionData | null): session is SessionData =>
  !!session?.isLoggedIn && !!session.accessToken && !!session.user?.id;

/**
 * The session held by a cookie jar, or `null` when there is none, the seal has
 * lapsed, or the payload does not describe a usable session.
 */
export const readSession = async (cookies: SessionCookieReader): Promise<SessionData | null> => {
  const sealed = cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sealed) {
    return null;
  }

  // Read outside the catch: a missing password is a misconfigured deployment,
  // not a visitor without a session, and must not be swallowed as one.
  const password = getSessionPassword();

  try {
    const session = await unsealData<SessionData>(sealed, {
      password,
      ttl: SESSION_TTL_SECONDS,
    });

    return isUsable(session) ? session : null;
  } catch {
    // A seal from a rotated password or a truncated cookie: no session.
    return null;
  }
};

/** Seals the session into the one cookie that carries it. */
export const writeSession = async (cookies: SessionCookieWriter, session: SessionData): Promise<void> => {
  const sealed = await sealData(session, {
    password: getSessionPassword(),
    ttl: SESSION_TTL_SECONDS,
  });

  cookies.set(SESSION_COOKIE_NAME, sealed, {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
  });
};

/** Clears it. */
export const clearSession = (cookies: SessionCookieWriter): void => {
  cookies.delete(SESSION_COOKIE_NAME);
};

/* ── The auth calls ───────────────────────────────────────────────────────── */

type JWTSessionResponse = components['schemas']['JWTSessionResponse'];
type UserResponse = components['schemas']['UserResponse'];

/*
 * Every auth call goes through the same generated client as the rest of the
 * application, typed against the specification and read through the shared
 * unwrapper — so a refusal arrives as the application's standard API error
 * carrying the API's own envelope, and there is no second description of an
 * auth request or response anywhere.
 *
 * See docs/adr/0010-one-client-for-the-auth-calls-too.md, which records why the
 * earlier hand-written requests are gone.
 */

const authorized = (accessToken: string) => ({ Authorization: `Bearer ${accessToken}` });

/**
 * What the generated client would otherwise derive from the request scope. In
 * the middleware runtime there is no such scope, so the caller reads both off
 * the incoming request and passes them in. The client's headers are caller-wins,
 * which is what makes stating them here an override rather than a special case.
 */
export type ApiRequestContext = {
  locale?: string;
  forwardedFor?: string;
};

const contextHeaders = ({ locale, forwardedFor }: ApiRequestContext): Record<string, string> => ({
  ...(locale ? { 'x-locale': locale } : {}),
  ...(forwardedFor ? { 'x-forwarded-for': forwardedFor } : {}),
});

/** Exchanges credentials for a token pair. Rejects when the API refuses them. */
const requestLogin = async (email: string, password: string): Promise<JWTSessionResponse> =>
  unwrapApiResponse(await apiServerClient['/api/v1/auth/login'].POST({ body: { email, password } }));

/**
 * Creates an account and returns the pair it is signed in with — the API issues
 * the password itself and mails it to the address, so there is nothing to send
 * beyond the email. Rejects when the API refuses; a `409` means taken.
 *
 * The locale is stated rather than left to the client because it decides which
 * language that mail is written in, and the caller knows which language the
 * visitor was reading.
 */
const requestRegistration = async (email: string, context: ApiRequestContext = {}): Promise<JWTSessionResponse> =>
  unwrapApiResponse(
    await apiServerClient['/api/v1/auth/register'].POST({
      body: { email },
      headers: contextHeaders(context),
    }),
  );

/**
 * Exchanges the session's refresh token for a fresh pair. Rejects when the
 * refresh token is spent or rejected, which is the signal to stop treating the
 * visitor as signed in.
 *
 * Three things are stated rather than left to the client. The bearer is the
 * session's *expired* access token, because the operation declares bearer or
 * API-key authentication and this application configures no API key — so the
 * only credential it has to present is the one that just ran out. The locale and
 * the caller's address are stated because the one caller is the middleware,
 * which runs before internationalisation has settled a locale and outside any
 * request scope the client could read an address from.
 */
const requestTokenRefresh = async (
  { accessToken, refreshToken }: Pick<SessionData, 'accessToken' | 'refreshToken'>,
  context: ApiRequestContext = {},
): Promise<JWTSessionResponse> =>
  unwrapApiResponse(
    await apiServerClient['/api/v1/auth/refresh-token'].POST({
      body: { refreshToken },
      headers: { ...authorized(accessToken), ...contextHeaders(context) },
    }),
  );

/**
 * Revokes the token server-side. Callers treat a failure here as non-fatal.
 *
 * The bearer is stated because the token being revoked is the one the caller
 * holds, which is not necessarily the one the client would read back out of the
 * cookie it is in the middle of clearing.
 */
const requestLogout = async (accessToken: string): Promise<void> => {
  await unwrapApiResponse(await apiServerClient['/api/v1/auth/logout'].POST({ headers: authorized(accessToken) }));
};

/**
 * The identity the access token's claims did not carry.
 *
 * The one call here that swallows a refusal: it runs while a session is being
 * assembled out of a pair the API has just issued, and an incomplete identity is
 * decided on by the caller rather than raised here. The bearer is that
 * brand-new token, which is not in a cookie yet for the client to find.
 */
const requestCurrentUser = async (accessToken: string): Promise<UserResponse | null> => {
  try {
    return await unwrapApiResponse(await apiServerClient['/api/v1/user/me'].GET({ headers: authorized(accessToken) }));
  } catch {
    return null;
  }
};

/* ── The operations ───────────────────────────────────────────────────────── */

export type Credentials = {
  email: string;
  password: string;
};

export type Registration = {
  email: string;
  /** Which language the API should write the account's welcome mail in. */
  locale?: string;
};

/*
 * Sign-in, registration, renewal, an email change and sign-out, each expressed
 * against a cookie jar rather than against `cookies()`. The server actions are
 * the wrappers that supply the request's jar; everything that decides what
 * lands in the cookie is here.
 *
 * A refusal is not caught and not translated: it travels as the standard API
 * error, which the one action client shapes into a structured action error the
 * form reads the API's own code off. See
 * docs/adr/0011-auth-failures-on-the-standard-action-error-channel.md.
 */

/**
 * Turns a freshly issued token pair into the session cookie.
 *
 * A pair the API issued that yields no identity is an internal fault rather
 * than anything the visitor can act on, so it raises a plain error and reaches
 * the form as the action library's default server error — not as a
 * credentials-shaped one.
 */
const establishSession = async (cookies: SessionCookieWriter, tokens: TokenPair): Promise<void> => {
  const session = await createSession(tokens);

  if (!session) {
    throw new Error('The token pair the API issued describes no user.');
  }

  await writeSession(cookies, session);
};

/** Exchanges credentials for a session and writes the cookie, or raises. */
export const performSignIn = async (cookies: SessionCookieWriter, { email, password }: Credentials): Promise<void> =>
  establishSession(cookies, await requestLogin(email, password));

/**
 * Creates the account and signs it in in the same step: registration returns a
 * token pair, so there is no reason to send someone who has just typed their
 * address back through a login form.
 */
export const performRegistration = async (
  cookies: SessionCookieWriter,
  { email, locale }: Registration,
): Promise<void> => establishSession(cookies, await requestRegistration(email, { locale }));

/**
 * Exchanges the refresh token for a new pair and writes it into the jar given.
 *
 * Returns the renewed session, or `null` when the exchange was refused — in
 * which case the jar is left holding no session at all, so whatever reads it
 * next sees an anonymous visitor rather than a token nothing will accept.
 *
 * Concurrent renewals are knowingly unguarded: the refresh token rotates, so
 * two requests arriving together can invalidate each other and sign the member
 * out. Deduplicating them is out of scope for now (see issue #16).
 */
export const performRenewal = async (
  cookies: SessionCookieWriter,
  session: SessionData,
  context: ApiRequestContext = {},
): Promise<SessionData | null> => {
  try {
    const renewed = renewSessionTokens(session, await requestTokenRefresh(session, context));

    await writeSession(cookies, renewed);

    return renewed;
  } catch {
    clearSession(cookies);

    return null;
  }
};

/**
 * Records a changed email address on the session already in the jar, leaving
 * the token pair exactly as it was.
 *
 * A member who edits their address stays signed in: the address is identity,
 * not authentication, and the tokens they hold are still the ones the API
 * issued them. A visitor without a session gets no session out of this.
 */
export const performEmailUpdate = async (cookies: SessionCookieWriter, email: string): Promise<void> => {
  const session = await readSession(cookies);

  if (session) {
    await writeSession(cookies, { ...session, user: { ...session.user, email } });
  }
};

/**
 * Revokes the token upstream and clears both cookies. The revocation is
 * best-effort: a member on a flaky connection is signed out locally either
 * way, because the alternative is being stuck half-signed-in.
 */
export const performSignOut = async (cookies: SessionCookieWriter): Promise<void> => {
  const session = await readSession(cookies);

  if (session) {
    try {
      await requestLogout(session.accessToken);
    } catch {
      // Best-effort by design; the cookies below go regardless.
    }
  }

  clearSession(cookies);
};

/* ── The request-scoped reader ─────────────────────────────────────────────── */

type GetSessionOptions = {
  /**
   * Send a visitor without a session to the login page instead of returning
   * `null`. For the screens that cannot render anything useful anonymously,
   * so that the caller is handed a session or nothing at all.
   */
  redirect?: boolean;
};

/**
 * The session the current request carries, or `null` for a visitor without
 * one. This is the one way server components, server actions and route
 * handlers read a session — nothing outside this module unseals a cookie for
 * itself.
 *
 * The middleware guards a protected route before it renders, so a call here
 * asking to redirect is a second line rather than the first one.
 */
export async function getSession(options?: { redirect?: false }): Promise<SessionData | null>;
export async function getSession(options: { redirect: true }): Promise<SessionData>;
export async function getSession({ redirect: redirectWhenMissing = false }: GetSessionOptions = {}) {
  const session = await readSession(await requestCookies());

  if (!session && redirectWhenMissing) {
    redirect(ROUTES.SIGN_IN);
  }

  return session;
}
