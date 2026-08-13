import { decodeAccessToken, readExpiryFromClaims, readIdentityFromClaims } from './access-token';
import { requestCurrentUser } from './session.api';
import type { SessionData, SessionUser } from './session.types';

type TokenPair = {
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
