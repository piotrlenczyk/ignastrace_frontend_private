import { sealData, unsealData } from 'iron-session';

import {
  getSessionPassword,
  SESSION_COOKIE_MAX_AGE_SECONDS,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  SESSION_TTL_SECONDS,
} from './session.constants';
import type { SessionData } from './session.types';

/*
 * The narrowest shape this module needs from a cookie jar. `cookies()` from
 * next/headers and `NextResponse.cookies` both satisfy it, which is what lets a
 * server action and the middleware share one implementation of the session's
 * reads and writes.
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
