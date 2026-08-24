import { apiServerClient } from '@/network/api/apiServerClient';
import { unwrapApiResponse } from '@/network/http-response-handler';

/**
 * How many items a page of the feed carries.
 *
 * The API's own default, stated here rather than left implicit because the
 * browser asks for the pages after this one and both sides have to agree on the
 * size — a screen whose first page is twenty and whose second is fifty reads as
 * a bug in the list rather than in the request.
 */
export const ACTIVITY_FEED_PAGE_SIZE = 20;

/**
 * The first page of the member's activity, as the API composes it.
 *
 * The feed merges location requests and reverse lookup reports and orders them by
 * recency across both, so nothing here sorts, filters or renames anything: what
 * arrives is a page and the cursor for the next one, handed on unchanged. The
 * screen's own view of a row is a separate concern and lives with the screen.
 *
 * Nothing is caught. A refusal rejects, because the one thing this must never do
 * is let a screen read "the API said no" as "you have done nothing yet" — an
 * empty list is a statement about the member, and only the API gets to make it.
 */
export const getActivityFeed = async () =>
  apiServerClient['/api/v1/activity-feed']
    .GET({ params: { query: { limit: ACTIVITY_FEED_PAGE_SIZE } } })
    .then(unwrapApiResponse);
