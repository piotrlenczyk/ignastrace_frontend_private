import { createSession, renewSessionTokens } from './session';
import { type ApiRequestContext, AuthApiError, requestLogin, requestLogout, requestTokenRefresh } from './session.api';
import { clearSession, readSession, type SessionCookieWriter, writeSession } from './session.cookies';
import type { SessionData } from './session.types';

export type SignInError = 'invalid_credentials' | 'unavailable';

export type SignInResult = { success: true } | { success: false; error: SignInError };

export type Credentials = {
  email: string;
  password: string;
};

/*
 * Sign-in and sign-out expressed against a cookie jar rather than against
 * `cookies()`. The server actions in `session.actions.ts` are the wrappers
 * that supply the request's jar; everything that decides what lands in the two
 * cookies lives here, so both operations can be driven directly in a test.
 */

/** Exchanges credentials for a session and writes both cookies, or neither. */
export const performSignIn = async (
  cookies: SessionCookieWriter,
  { email, password }: Credentials,
): Promise<SignInResult> => {
  let tokens;

  try {
    tokens = await requestLogin(email, password);
  } catch (error) {
    const refused = error instanceof AuthApiError && (error.status === 401 || error.status === 404);

    return { success: false, error: refused ? 'invalid_credentials' : 'unavailable' };
  }

  const session = await createSession(tokens);

  if (!session) {
    return { success: false, error: 'unavailable' };
  }

  await writeSession(cookies, session);

  return { success: true };
};

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
    const renewed = renewSessionTokens(session, await requestTokenRefresh(session.refreshToken, context));

    await writeSession(cookies, renewed);

    return renewed;
  } catch {
    clearSession(cookies);

    return null;
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
