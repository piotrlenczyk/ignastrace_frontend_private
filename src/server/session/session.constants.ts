/*
 * Cookie names, lifetimes and options for the session pair.
 *
 * The session is two cookies that are always written together: a sealed,
 * http-only one holding the token pair and the identity, and a companion one
 * holding the raw access token so page scripts can call the API directly.
 *
 * `session.cookies.ts` is the only place either of them is written. The
 * readable one is also read in the browser, and there `libs/session-cookie.ts`
 * is the only place that does it — a client component never reaches for
 * `document.cookie` itself.
 */

export const SESSION_COOKIE_NAME = 'ignastrace_session';

export const ACCESS_TOKEN_COOKIE_NAME = 'ignastrace_access_token';

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

/*
 * Deliberately not http-only: this is the copy client components read. It is
 * the only part of the session a page script can see, which is why the tokens
 * that can mint a new session live in the sealed cookie instead.
 */
export const ACCESS_TOKEN_COOKIE_OPTIONS = {
  httpOnly: false,
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
