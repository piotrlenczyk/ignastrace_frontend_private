'use client';

import { useSession } from '@/hooks/use-session';

import { $api } from '../api-browser-client';

/** The generated key this query is cached under, for invalidating it after a write that changes the account. */
export const CURRENT_USER_QUERY_KEY = $api.queryOptions('get', '/api/v1/user/me', {}).queryKey;

/**
 * The signed-in member's profile, read through the proxy and typed from the
 * generated specification.
 *
 * This is the client-side replacement for the legacy `useGetUser`. The two are
 * not the same question: the legacy endpoint answered with the funnel's whole
 * view of a member — subscription status, upsellings, purchase prices, the
 * unread notification count — where `/api/v1/user/me` answers with the account
 * itself. A screen that needs one of those other facts asks the endpoint that
 * owns it; there is no longer one call that returns everything, and nothing
 * composes one either — the fixture that used to stand in for the rest of that
 * view is gone (ADR 0038).
 *
 * Identity is not one of the things it is for. Who is signed in is already in
 * the tree before hydration, from the sealed session — `useSession` is the
 * answer to that, and asking the network for it would only be a slower way to
 * learn what the first paint already knew. This hook is for the fields the
 * session does not carry: the display name, the photo, the language, the
 * unlimited-downloads entitlement.
 *
 * Hence the gate. Anonymous, there is no current user to fetch and the endpoint
 * says so with a 401, so the call is not made at all; the session tells us that
 * for free. A 401 that does get through therefore means a session that died
 * mid-visit, and is left to the call site — a dead session means different
 * things behind the member area and on a page that merely decorates itself with
 * a name.
 */
export const useCurrentUserQuery = () => {
  const { isSignedIn } = useSession();

  return $api.useQuery('get', '/api/v1/user/me', {}, { enabled: isSignedIn });
};
