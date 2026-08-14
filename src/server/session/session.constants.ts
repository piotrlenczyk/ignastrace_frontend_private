import type { SessionOptions } from 'iron-session';

/*
 * Cookie name, lifetimes and options for the session.
 *
 * The session is one sealed, http-only cookie holding the token pair and the
 * identity. Nothing about it is legible to a page script: the browser reaches
 * both backends through proxies that attach the bearer server-side, and learns
 * who is signed in from the session provider the root layout renders.
 *
 * `session.utils.ts` and the middleware's session step are the only places it
 * is read or written.
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

export const SESSION_COOKIE_OPTIONS: SessionOptions['cookieOptions'] = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
  path: '/',
};

/**
 * Everything iron-session needs, assembled on each call rather than held as a
 * module constant. The sealing password is read at that moment so the process
 * can be started without it for anything that never touches a session, and so
 * a test can set it after this module has been imported.
 */
export const getSessionOptions = (): SessionOptions => {
  const password = process.env.SESSION_PASSWORD;

  if (!password || password.length < 32) {
    throw new Error('SESSION_PASSWORD must be set to at least 32 characters to seal the session cookie.');
  }

  return {
    password,
    cookieName: SESSION_COOKIE_NAME,
    ttl: SESSION_TTL_SECONDS,
    cookieOptions: SESSION_COOKIE_OPTIONS,
  };
};
