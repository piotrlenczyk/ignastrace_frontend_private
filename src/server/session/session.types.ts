import type { components } from '@/network/api/api';

/** `GUEST` accounts exist in the API but are never created here; see issue #16. */
export type AccountType = components['schemas']['UserResponse']['type'];

export type SessionUser = {
  id: string;
  /*
   * Everything but the id is optional: the access token's claims are the
   * primary source and the API is not contracted to emit any particular one.
   * What is missing at sign-in is filled from the current-user endpoint.
   */
  email?: string;
  type?: AccountType;
  roles?: string[];
};

export type SessionData = {
  isLoggedIn: boolean;
  accessToken: string;
  /** Epoch milliseconds, taken from the access token's `exp` claim. */
  accessTokenExpiresAt: number;
  refreshToken: string;
  user: SessionUser;
};

/**
 * The claims this application reads off an access token. Every one is optional
 * because the token is issued by the API, not by us — a claim that turns out
 * to be absent costs a call to the current-user endpoint, not a crash.
 */
export type AccessTokenClaims = {
  sub?: string;
  id?: string;
  userId?: string;
  email?: string;
  type?: string;
  accountType?: string;
  roles?: string[];
  /** Epoch seconds, as per RFC 7519. */
  exp?: number;
};
