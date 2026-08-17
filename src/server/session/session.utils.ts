import { getIronSession } from 'iron-session';
import { jwtDecode } from 'jwt-decode';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { ROUTES } from '@/constants/routes';

import { getSessionOptions } from './session.constants';
import type { JWT, SessionData } from './session.types';

/*
 * The session: what a token pair means, and the two ways the application reads
 * it. Nothing here calls the API — the auth requests live with the actions that
 * make them, and the renewal request lives with the middleware step that makes
 * that one.
 *
 * The middleware takes `createSessionObject` from here and nothing else. It
 * could reach `cookies()` — Next does give it a request scope — but a cookie it
 * wrote through one would be flushed with `headers.set('set-cookie', …)` and
 * drop the tracking step's cookies off the same response, so it seals by hand.
 * See docs/adr/0012-the-session-through-iron-session-s-own-api.md.
 */

/**
 * The identity the API put in the access token.
 *
 * Raises both on a token that will not decode and on one that decodes to
 * something short of an identity. `jwtDecode` only does the first, and the
 * second matters: a token without an `exp` would otherwise seal with an expiry
 * of `NaN`, which every comparison reads as "not yet expired" and the
 * middleware would renew on every request; one without an `id` would seal into
 * a cookie that then reads back as an anonymous visitor. Both are failures of
 * the API rather than anything the visitor can act on, so they raise here and
 * arrive at the form as the action library's default server error.
 */
const decodeTokenJWT = (accessToken: string): JWT => {
  const claims = jwtDecode<Partial<JWT>>(accessToken);

  if (!claims.id || !claims.type || !Array.isArray(claims.roles) || typeof claims.exp !== 'number') {
    throw new Error('The access token the API issued carries no usable identity.');
  }

  return claims as JWT;
};

export type TokenPair = {
  access: string;
  refresh: string;
};

/** The session a freshly issued token pair describes. */
export const createSessionObject = ({ access, refresh }: TokenPair): SessionData => {
  const { id, email, type, roles, exp } = decodeTokenJWT(access);

  return {
    isLoggedIn: true,
    accessToken: access,
    accessTokenExpiresAt: exp * 1000,
    refreshToken: refresh,
    user: { id, email, type, roles },
  };
};

/**
 * Whether a payload describes a session at all, as opposed to an empty cookie
 * or one whose contents no longer add up. One definition, because the middleware
 * unsealing by hand, the reader below and the writes all have to agree on it —
 * a session one of them accepts and another discards is a member signed in
 * according to the page and signed out according to the guard.
 *
 * Whether a *guest* counts is a separate question, and the caller's.
 */
export const isUsableSession = (session: Partial<SessionData> | null): boolean =>
  !!session?.isLoggedIn && !!session.accessToken && !!session.user?.id;

/**
 * The request's session, with iron-session's own `save` and `destroy` on it.
 *
 * This is what the writes use, and what a caller that only wants the bearer
 * uses — an empty session is an object with no `accessToken`, not `null`, so
 * test the field rather than the object.
 */
export const getSession = async () => getIronSession<SessionData>(await cookies(), getSessionOptions());

export type ServerSessionOptions = {
  /**
   * Send a visitor without a session to the login page instead of returning
   * `null`. For the screens that cannot render anything useful anonymously.
   */
  shouldRedirect?: boolean;
  /** Where that redirect goes. The login page unless a caller says otherwise. */
  redirectPath?: string;
  /**
   * Treat a guest-typed session as a session. Off by default: a guest is not
   * admitted to the member area, and the guards treat one exactly as they treat
   * no session at all.
   */
  acceptGuest?: boolean;
};

/**
 * The session the current request carries, or `null` for a visitor without
 * one. This is how server components, route handlers and anything reading an
 * identity ask — `getSession` above is for the writes and for a bearer.
 *
 * The middleware guards a protected route before it renders, so a call here
 * asking to redirect is a second line rather than the first one.
 */
export async function getServerSession(
  options?: { shouldRedirect?: false } & ServerSessionOptions,
): Promise<SessionData | null>;
export async function getServerSession(options: { shouldRedirect: true } & ServerSessionOptions): Promise<SessionData>;
export async function getServerSession({
  shouldRedirect = false,
  redirectPath = ROUTES.SIGN_IN,
  acceptGuest = false,
}: ServerSessionOptions = {}) {
  const session = await getSession();
  const loggedIn = isUsableSession(session) && (acceptGuest || session.user.type === 'USER');

  if (!loggedIn) {
    if (shouldRedirect) {
      redirect(redirectPath);
    }

    return null;
  }

  return {
    isLoggedIn: session.isLoggedIn,
    accessToken: session.accessToken,
    accessTokenExpiresAt: session.accessTokenExpiresAt,
    refreshToken: session.refreshToken,
    user: session.user,
  };
}

/** Writes the session a token pair describes into the request's cookie. */
export const setSession = async (tokens: TokenPair): Promise<void> => {
  const session = await getSession();
  const { isLoggedIn, accessToken, accessTokenExpiresAt, refreshToken, user } = createSessionObject(tokens);

  session.isLoggedIn = isLoggedIn;
  session.accessToken = accessToken;
  session.accessTokenExpiresAt = accessTokenExpiresAt;
  session.refreshToken = refreshToken;
  session.user = user;

  await session.save();
};

/**
 * Carries a changed email address into the request's session.
 *
 * The tokens are left exactly as they were — the address is identity, not
 * authentication — so a member who has just edited their profile stays signed in.
 * A visitor without a usable session gets nothing written, rather than a session
 * minted out of an edit.
 */
export const setSessionEmail = async (email: string): Promise<void> => {
  const session = await getSession();

  if (!isUsableSession(session)) {
    return;
  }

  session.user = { ...session.user, email };

  await session.save();
};
