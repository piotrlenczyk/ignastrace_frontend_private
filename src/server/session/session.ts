import { decodeAccessToken, readExpiryFromClaims, readIdentityFromClaims } from './access-token';
import { requestCurrentUser } from './session.api';
import { ACCESS_TOKEN_EXPIRY_SKEW_MS } from './session.constants';
import type { SessionData, SessionUser } from './session.types';

export type TokenPair = {
  token: string;
  refreshToken: string;
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
export const createSession = async (
  { token, refreshToken }: TokenPair,
  now = Date.now(),
): Promise<SessionData | null> => {
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
export const renewSessionTokens = (
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
 * Whether the access token has run out, counted a little early so that a clock
 * this application and the API disagree on cannot produce a request refused
 * for a token it believed was still good.
 */
export const isAccessTokenExpired = (session: SessionData, now = Date.now()): boolean =>
  session.accessTokenExpiresAt - ACCESS_TOKEN_EXPIRY_SKEW_MS <= now;

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
 * Whether a session belongs to a full account. Guest-typed sessions exist in
 * the API's model and are carried here, but they are not admitted to the
 * member area — the guards treat them exactly as they treat no session at all.
 */
export const isFullUserSession = (session: SessionData | null): boolean => session?.user.type === 'USER';
