'use client';

import { $api } from '@/network/api/api-browser-client';

/** How often the sections are re-read while the social search is still running. */
export const SECTIONED_REPORT_POLL_INTERVAL_MS = 3000;

/**
 * The report's sections, re-read from the browser while its social-networks
 * search is still running.
 *
 * The only browser-side read on this screen. Everything else about the report is
 * fetched on the server and passed down as props; this exists because the
 * expanded social search finishes after the page has rendered and a member should
 * not have to reload to see it.
 *
 * When to stop is the response's own business, not the caller's: the section
 * carries a state, and polling continues exactly while that state is `PENDING`.
 * The caller says only whether to start — the server-rendered section was already
 * running, or the member has just unlocked it — because that is the one thing the
 * first response cannot say before it arrives.
 */
export const useSectionedReportQuery = (reportId: string, { enabled }: { enabled: boolean }) =>
  $api.useQuery(
    'get',
    '/api/v1/reverse-lookup-reports/{reportId}/sections',
    { params: { path: { reportId } } },
    {
      enabled,
      refetchInterval: ({ state }) =>
        state.data?.socialMedia.state === 'PENDING' ? SECTIONED_REPORT_POLL_INTERVAL_MS : false,
    },
  );
