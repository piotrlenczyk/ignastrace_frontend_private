import { jwtDecode } from 'jwt-decode';
import type { config } from 'process';

import type { session } from '../middleware/session';
import type { SessionData } from './session.types';

/*
 * The payments credential: everything about the second token pair the session
 * carries, in one module, so that removing it is a deletion.
 *
 * The payments upstream authenticates a member by a cookie holding an access
 * token *it* issued. The only deployment that answers today is a foreign one, so
 * the tokens this application's API mints are meaningless to it and every
 * user-facing payments call is refused. Until an upstream exists that trusts
 * them, the credential presented is one technical account's, seeded from
 * configuration and kept alive here.
 *
 * TEMPORARY by construction, and knowingly a shared identity: on any environment
 * where it is configured, every member's payments calls are made as that one
 * account. docs/adr/0023-a-shared-technical-account-for-the-payments-upstream.md
 * records the trade and the condition for deleting this file.
 */

/** The three fields this module owns, and the only ones it ever writes. */
type PaymentsCredential = Pick<
  SessionData,
  'paymentsAccessToken' | 'paymentsAccessTokenExpiresAt' | 'paymentsRefreshToken'
>;

const NO_CREDENTIAL: PaymentsCredential = {
  paymentsAccessToken: undefined,
  paymentsAccessTokenExpiresAt: undefined,
  paymentsRefreshToken: undefined,
};

/**
 * The renewal endpoint and the refresh token to seed it with, or nothing.
 *
 * Read on each call rather than held as a module constant, for the reason the
 * session's own options are: the process starts without them, and unsetting
 * either one has to be enough to switch this off.
 *
 * Both or neither. A URL with no token to spend at it, or a token with nowhere
 * to spend it, is a half-configured environment rather than a usable one.
 */
const configuration = (): {
  renewalUrl: string;
  seedAccessToken: string;
  seedRefreshToken: string;
  cfAccessClientId: string;
  cfAccessClientSecret: string;
} | null => {
  const renewalUrl = process.env.PAYMENTS_API_TOKEN_REFRESH_URL;
  const seedAccessToken = process.env.PAYMENTS_API_SEED_ACCESS_TOKEN ?? '';
  const seedRefreshToken = process.env.PAYMENTS_API_SEED_REFRESH_TOKEN;
  const cfAccessClientId = process.env.CF_ACCESS_CLIENT_ID ?? '';
  const cfAccessClientSecret = process.env.CF_ACCESS_CLIENT_SECRET ?? '';
  return renewalUrl && seedRefreshToken
    ? { renewalUrl, seedAccessToken, seedRefreshToken, cfAccessClientId, cfAccessClientSecret }
    : null;
};

/**
 * Carries the payments credential from one session payload onto the next.
 *
 * The API pair's renewal builds a session out of a freshly issued pair alone —
 * the module that does that knows nothing about payments, and should not — so the
 * credential is put back afterwards. Without this a member whose API token
 * expired would pay for a foreign round trip on the same request.
 */
export const carryPaymentsCredential = (from: SessionData, onto: SessionData): SessionData => ({
  ...onto,
  paymentsAccessToken: from.paymentsAccessToken,
  paymentsAccessTokenExpiresAt: from.paymentsAccessTokenExpiresAt,
  paymentsRefreshToken: from.paymentsRefreshToken,
});

/**
 * When the payments access token runs out, in epoch milliseconds.
 *
 * The token is decoded for its expiry and for nothing else: who the member is
 * comes from the API pair, and this account is not them. A token that will not
 * decode, or that carries no expiry, counts as *already* expired — the
 * alternative is sealing `NaN`, which every comparison reads as "still valid" and
 * which would pin the session to a credential that can never be replaced.
 */
const claimsOf = (accessToken: string): { exp?: number } | null => {
  try {
    return jwtDecode<{ exp?: number }>(accessToken);
  } catch {
    return null;
  }
};

const expiryOf = (accessToken: string): number => {
  const exp = claimsOf(accessToken)?.exp;

  if (typeof exp !== 'number') {
    console.error('The payments credential carries no readable expiry; it is treated as already expired.');

    return 0;
  }

  return exp * 1000;
};

/**
 * Spends a refresh token at the payments upstream for a fresh pair.
 *
 * A bare request with a hand-written response type, rather than a third
 * generated client: the browser never makes this call, one endpoint is the whole
 * surface, and a generated specification would be a thing to maintain for
 * something written to be deleted.
 *
 * The contract is assumed to be the API's own renewal operation — the two
 * backends share an origin — so a POST carrying the refresh token, answering
 * with a fresh pair. Host and path arrive as one configured URL and the two
 * fields are read in one place, so a wrong assumption is a configuration fix or
 * a two-line one.
 *
 * No timeout and no back-off, deliberately (see the record).
 */
const requestRenewal = async (
  renewalUrl: string,
  accessToken: string,
  refreshToken: string,
  cfAccessClientId: string,
  cfAccessClientSecret: string,
): Promise<{ token: string; refresh: string }> => {
  const response = await fetch(renewalUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'CF-Access-Client-Id': cfAccessClientId,
      'CF-Access-Client-Secret': cfAccessClientSecret,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error(`The payments upstream refused the credential renewal with ${response.status}.`);
  }

  const body: unknown = await response.json();
  const { token, refreshToken: rotated } = (body ?? {}) as { token?: unknown; refreshToken?: unknown };

  if (typeof token !== 'string' || typeof rotated !== 'string') {
    throw new Error('The payments upstream answered the renewal with no token pair.');
  }

  return { token, refresh: rotated };
};

/** Whether the session holds any part of a payments credential at all. */
const holdsCredential = (session: SessionData): boolean =>
  !!session.paymentsAccessToken || !!session.paymentsRefreshToken || !!session.paymentsAccessTokenExpiresAt;

/**
 * The session with a live payments credential on it, or `null` when there is
 * nothing to change — which is the common case, and the one that must not reseal
 * the cookie.
 *
 * Renewal is lazy: it happens when the credential is absent or has run out, on
 * whichever request that turns out to be, page or route handler alike. The
 * configured refresh token is only a seed — the rotated one lives in the session
 * from then on, and an empty one means seed again, which is what lets a lost
 * rotation repair itself.
 *
 * A refusal or an unreachable upstream clears the three fields and leaves the
 * member signed in: the API pair is what says who they are, and a foreign
 * system's outage is not a sign-out. The payments call then goes out
 * unauthenticated, exactly as it does for a visitor with no session.
 *
 * With the configuration absent this does nothing at all — beyond dropping a
 * credential an earlier configuration left behind, so that unsetting the
 * variables switches the arrangement off rather than freezing it.
 */
export const withPaymentsCredential = async (session: SessionData): Promise<SessionData | null> => {
  const config = configuration();

  if (!config) {
    return holdsCredential(session) ? { ...session, ...NO_CREDENTIAL } : null;
  }

  const isDue = !session.paymentsAccessToken || Date.now() >= (session.paymentsAccessTokenExpiresAt ?? 0);

  if (!isDue) {
    return null;
  }

  try {
    const { token, refresh } = await requestRenewal(
      config.renewalUrl,
      session.paymentsAccessToken ?? config.seedAccessToken,
      session.paymentsRefreshToken || config.seedRefreshToken,
      config.cfAccessClientId,
      config.cfAccessClientSecret,
    );

    return {
      ...session,
      paymentsAccessToken: token,
      paymentsAccessTokenExpiresAt: expiryOf(token),
      paymentsRefreshToken: refresh,
    };
  } catch (error) {
    console.error('The payments credential could not be renewed; payments calls go out unauthenticated.', error);

    return { ...session, ...NO_CREDENTIAL };
  }
};
