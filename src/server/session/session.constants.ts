/*
 * Cookie name, lifetimes and options for the session.
 *
 * The session is one sealed, http-only cookie holding the token pair and the
 * identity. Nothing about it is legible to a page script: the browser reaches
 * both backends through proxies that attach the bearer server-side, and learns
 * who is signed in from the session provider the root layout renders.
 *
 * `session.cookies.ts` is the only place it is written.
 */

export const SESSION_COOKIE_NAME = 'ignastrace_session';

/** One month — how long the seal itself stays valid. */
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

/*
 * The cookie is given a shorter life than the seal, so the browser drops it
 * before iron-session would start rejecting the payload it carries. Without
 * the gap a request can arrive holding a cookie that unseals to an error.
 */
export const SESSION_COOKIE_MAX_AGE_SECONDS = SESSION_TTL_SECONDS - 60 * 60;

/** The access token's own lifetime, used when its claims carry no expiry. */
export const ACCESS_TOKEN_FALLBACK_TTL_SECONDS = 60 * 60 * 24;

/*
 * How far ahead of the recorded expiry a token is already treated as expired.
 * The API's clock and this one need not agree, and a token renewed a few
 * seconds early costs nothing next to a request refused for being a second
 * late.
 */
export const ACCESS_TOKEN_EXPIRY_SKEW_MS = 30 * 1000;

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
} as const;

/**
 * The sealing password. Read through a function rather than a module constant
 * so that the process can be started without it for anything that never
 * touches a session, and so tests can set it before the first seal.
 */
export const getSessionPassword = (): string => {
  const password = process.env.SESSION_PASSWORD;

  if (!password || password.length < 32) {
    throw new Error('SESSION_PASSWORD must be set to at least 32 characters to seal the session cookie.');
  }

  return password;
};
