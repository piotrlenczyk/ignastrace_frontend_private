import { ACCESS_TOKEN_FALLBACK_TTL_SECONDS } from './session.constants';
import type { AccessTokenClaims, AccountType, SessionUser } from './session.types';

const ACCOUNT_TYPES: AccountType[] = ['GUEST', 'USER'];

const decodeBase64Url = (segment: string): string => {
  const padded = segment
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(segment.length / 4) * 4, '=');

  // `atob` rather than Buffer: this runs in the middleware runtime too.
  return atob(padded);
};

/**
 * Reads the claims out of an access token without verifying its signature.
 * Verification is the API's job — a token this application forged for itself
 * would buy it nothing, because every call still carries the token upstream.
 */
export const decodeAccessToken = (token: string): AccessTokenClaims | null => {
  const payload = token.split('.')[1];

  if (!payload) {
    return null;
  }

  try {
    const claims: unknown = JSON.parse(decodeBase64Url(payload));

    return typeof claims === 'object' && claims !== null ? (claims as AccessTokenClaims) : null;
  } catch {
    return null;
  }
};

const asAccountType = (value: string | undefined): AccountType | undefined =>
  ACCOUNT_TYPES.find((type) => type === value);

/** The identity carried by the token, as far as the token happens to carry it. */
export const readIdentityFromClaims = (claims: AccessTokenClaims | null): Partial<SessionUser> => {
  if (!claims) {
    return {};
  }

  const id = claims.sub ?? claims.id ?? claims.userId;
  const type = asAccountType(claims.type ?? claims.accountType);

  return {
    ...(id ? { id } : {}),
    ...(claims.email ? { email: claims.email } : {}),
    ...(type ? { type } : {}),
    ...(claims.roles ? { roles: claims.roles } : {}),
  };
};

/**
 * When the token carries an `exp`, that is the expiry. When it does not, the
 * API documents a 24-hour access token, so assume that rather than treat the
 * session as already expired.
 */
export const readExpiryFromClaims = (claims: AccessTokenClaims | null, now: number): number =>
  typeof claims?.exp === 'number' ? claims.exp * 1000 : now + ACCESS_TOKEN_FALLBACK_TTL_SECONDS * 1000;
