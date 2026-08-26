'use client';

import { useSession } from '@/hooks/use-session';

import { $api } from '../api-browser-client';

/**
 * The generated key this query is cached under, for invalidating it after the
 * notifications screen marks something read.
 */
export const UNREAD_NOTIFICATION_COUNT_QUERY_KEY = $api.queryOptions(
  'get',
  '/api/v1/notification/center/unread/count',
  {},
).queryKey;

/**
 * How long the count is trusted without asking again.
 *
 * The badge is rendered by the layout that wraps every member-area screen, so
 * without this every navigation inside the member area would be a request for a
 * number that changes when the backend sends a notification — which is to say
 * rarely. A minute keeps the chatter down and still refreshes for a member who
 * comes back to the tab after a while.
 */
const STALE_TIME = 60_000;

/**
 * How many notifications the member has not read.
 *
 * This is what the header badge shows, and it is the answer that replaces a
 * fixture: the count used to come off the composed member, where it was a
 * hard-coded three out of the mocked membership — so every signed-in member saw
 * the same three, whatever the notifications screen listed. It is the first
 * field to leave that mock because a real endpoint arrived.
 *
 * The list response carries the same number on its `meta`, and it is deliberately
 * not the source: the badge is drawn on every member-area screen and the list is
 * read on one of them, so the dedicated endpoint is the only one that can answer
 * everywhere the badge is.
 *
 * Gated on the session for the reason the current-user read gives: anonymous
 * there is no count to fetch and the endpoint says so with a 401.
 */
export const useUnreadNotificationCountQuery = () => {
  const { isSignedIn } = useSession();

  return $api.useQuery(
    'get',
    '/api/v1/notification/center/unread/count',
    {},
    { enabled: isSignedIn, staleTime: STALE_TIME },
  );
};
