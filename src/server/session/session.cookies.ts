import { sealData, unsealData } from 'iron-session';

import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_COOKIE_OPTIONS,
  getSessionPassword,
  SESSION_COOKIE_MAX_AGE_SECONDS,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  SESSION_TTL_SECONDS,
} from './session.constants';
import type { SessionData } from './session.types';

/*
 * The narrowest shape this module needs from a cookie jar. `cookies()` from
 * next/headers and `NextResponse.cookies` both satisfy it, which is what lets
 * the write-both-or-neither rule hold in a server action and in middleware
 * without two implementations of it.
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

/**
 * Writes both cookies. The readable copy expires with the token it carries, so
 * a client that still has it is holding something the API will still accept.
 */
export const writeSession = async (cookies: SessionCookieWriter, session: SessionData): Promise<void> => {
  const sealed = await sealData(session, {
    password: getSessionPassword(),
    ttl: SESSION_TTL_SECONDS,
  });

  cookies.set(SESSION_COOKIE_NAME, sealed, {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
  });

  cookies.set(ACCESS_TOKEN_COOKIE_NAME, session.accessToken, {
    ...ACCESS_TOKEN_COOKIE_OPTIONS,
    expires: new Date(session.accessTokenExpiresAt),
  });
};

/** Clears both cookies. There is no operation that clears only one. */
export const clearSession = (cookies: SessionCookieWriter): void => {
  cookies.delete(SESSION_COOKIE_NAME);
  cookies.delete(ACCESS_TOKEN_COOKIE_NAME);
};
