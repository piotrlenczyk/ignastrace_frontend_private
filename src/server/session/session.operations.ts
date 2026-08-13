import { createSession } from './session';
import { AuthApiError, requestLogin, requestLogout } from './session.api';
import { clearSession, readSession, type SessionCookieWriter, writeSession } from './session.cookies';

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
