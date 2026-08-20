import type { components } from '@/network/api/api';

/** `GUEST` accounts exist in the API but are never created here; see issue #16. */
export type AccountType = components['schemas']['UserResponse']['type'];

export type SessionUser = {
  id: string;
  email?: string;
  type: AccountType;
  roles: string[];
};

export type SessionData = {
  isLoggedIn: boolean;
  accessToken: string;
  /** Epoch milliseconds, taken from the access token's `exp` claim. */
  accessTokenExpiresAt: number;
  refreshToken: string;
  user: SessionUser;
  /*
   * The payments credential: a second pair, for the other upstream, belonging to
   * one technical account rather than to this member. Optional because a session
   * is minted without it and stays usable without it — who the member is comes
   * from the pair above, and only from there.
   *
   * TEMPORARY, and removable by deletion: the fields, the module that fills them
   * and one branch of the middleware's session step go together the day a
   * payments deployment trusts the API's own tokens. See
   * docs/adr/0023-a-shared-technical-account-for-the-payments-upstream.md.
   */
  paymentsAccessToken?: string;
  /** Epoch milliseconds, taken from the payments access token's `exp` claim. */
  paymentsAccessTokenExpiresAt?: number;
  paymentsRefreshToken?: string;
};

/**
 * The claims this application reads off an access token.
 *
 * Everything but the address is required: the token is the only source of the
 * identity, so a token that does not carry one cannot produce a session. The
 * decode raises rather than reaching for the current-user endpoint —
 * see docs/adr/0012-the-session-through-iron-session-s-own-api.md.
 */
export type JWT = {
  id: string;
  email?: string;
  type: AccountType;
  roles: string[];
  /** Epoch seconds, as per RFC 7519. */
  iat: number;
  exp: number;
};
