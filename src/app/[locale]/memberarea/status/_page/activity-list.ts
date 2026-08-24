import type { components } from '@/network/api/api';

import type { ActivityRow, ActivityStatus } from './activity-row';

/*
 * The whole of the seam between the activity feed and the list that shows it.
 *
 * One source now answers for the list: the API's activity feed, which merges
 * location requests and reverse lookup reports and orders them by recency across
 * both. The record on that adoption states what it cost — the feed models two
 * kinds, so a sex offender report has no representation in it, and the row's
 * report id is assumed to name the same report the legacy report screen reads.
 *
 * This module is a pure mapping and nothing else: no client, no cache, no
 * ordering. That is what lets the screen map the page it rendered on the server
 * and the browser map the pages it fetches afterwards through the same function.
 */

type ActivityItem = components['schemas']['ActivityItemResponse'];

/**
 * The two source vocabularies, onto the four states the screen draws.
 *
 * A location request states three; a reverse lookup report states four, two of
 * which the screen has no separate picture for — a report being generated is
 * still "waiting", and one whose generation failed is shown the same way as a
 * request the recipient turned down.
 */
const STATUSES = {
  PENDING: 'PENDING',
  LOCATED: 'LOCATED',
  REJECTED: 'REJECTED',
  PROCESSING: 'PENDING',
  COMPLETED: 'READY',
  FAILED: 'REJECTED',
} as const satisfies Record<string, ActivityStatus>;

/**
 * The feed passes each source's own status through unmapped and types it as a
 * plain string, so a value this screen has never been taught is part of the
 * contract rather than an anomaly. It reads as one still waiting: the row stays
 * on the list and is not navigable, which is the honest picture of "something is
 * happening that we cannot describe yet".
 */
const toStatus = (status: string): ActivityStatus => STATUSES[status as keyof typeof STATUSES] ?? 'PENDING';

/**
 * One feed item as a row.
 *
 * The feed's kind alone does not say which of the two location requests this is —
 * that is on the nested location, which is also the only place an answered
 * request's address is. Everything the screen varies between the two varies as a
 * pair, so the pair becomes the row's kind.
 */
const toActivityRow = (item: ActivityItem): ActivityRow => {
  const byLink = item.kind === 'LOCATION_REQUEST' && item.location?.type === 'FIND_BY_LINK';

  return {
    id: item.id,
    kind:
      item.kind === 'REVERSE_LOOKUP_REPORT'
        ? 'REVERSE_LOOKUP_REPORT'
        : byLink
          ? 'LOCATION_BY_LINK'
          : 'LOCATION_BY_NUMBER',
    status: toStatus(item.status),
    /*
     * A link-type request is called by the name the member gave it; everything
     * else is called by the number it concerns — the request's recipient, or the
     * subject of the report.
     */
    title: (byLink ? item.location?.linkName : item.phone) ?? '',
    address: item.location?.address ?? undefined,
    /*
     * The feed's own sort key, so the date a row shows is the one the list is
     * ordered by. `statusUpdatedAt` is the truer answer to "when did this last
     * change", and it is deliberately not used: it would put dates out of order
     * down a list nobody re-sorts.
     */
    updatedAt: item.updatedAt,
  };
};

/**
 * A page of the feed as rows, in the order the API listed them.
 *
 * Nothing is sorted here. The feed is ordered by recency across both of its
 * kinds, and a sort inside one page could only ever contradict that — the pages
 * after this one are not in hand to sort against.
 */
export const toActivityRows = (items: ActivityItem[]): ActivityRow[] => items.map(toActivityRow);
