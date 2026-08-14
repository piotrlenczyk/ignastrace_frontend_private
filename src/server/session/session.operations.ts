import { createSession, renewSessionTokens, type TokenPair } from './session';
import {
  type ApiRequestContext,
  requestLogin,
  requestLogout,
  requestRegistration,
  requestTokenRefresh,
} from './session.api';
import { clearSession, readSession, type SessionCookieWriter, writeSession } from './session.cookies';
import type { SessionData } from './session.types';

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
 * Sign-in, registration and sign-out expressed against a cookie jar rather than
 * against `cookies()`. The server actions in `session.actions.ts` are the
 * wrappers that supply the request's jar; everything that decides what lands in
 * the two cookies lives here.
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
