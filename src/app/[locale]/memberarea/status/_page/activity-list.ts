import type { components } from '@/network/api/api';

import type { ActivityKind, ActivityRow, ActivityStatus } from './activity-row';

/*
 * The whole of the seam between the activity feed and the list that shows it.
 *
 * One source answers for the list: the API's activity feed, which merges location
 * requests, reverse lookup reports and purchased sex offender search reports, and
 * orders them by recency across all three.
 *
 * This module is a pure mapping and nothing else: no client, no cache, no
 * ordering. That is what lets the screen map the page it rendered on the server
 * and the browser map the pages it fetches afterwards through the same function.
 */

type ActivityItem = components['schemas']['ActivityItemResponse'];

/**
 * The three source vocabularies, onto the four states the screen draws.
 *
 * A location request states three; a reverse lookup report states four, two of
 * which the screen has no separate picture for — a report being generated is
 * still "waiting", and one whose generation failed is shown the same way as a
 * request the recipient turned down. A purchased sex offender search report
 * states one word, `READY`: it exists because it was bought, so there is nothing
 * else for it to be.
 *
 * One table for all three rather than one per kind, because the kind adds nothing
 * to the answer: the seven words do not collide. It is deliberately not derived
 * from the kind either — if that third source ever gains an intermediate state, a
 * row must read as one still waiting rather than assert a readiness nobody stated.
 */
const STATUSES = {
  PENDING: 'PENDING',
  LOCATED: 'LOCATED',
  REJECTED: 'REJECTED',
  PROCESSING: 'PENDING',
  COMPLETED: 'READY',
  FAILED: 'REJECTED',
  READY: 'READY',
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
 * Which of the list's kinds a feed item is.
 *
 * Every source kind is answered for by name, so a fourth one arriving upstream is
 * a compile error here rather than a row quietly drawn as something it is not —
 * which is exactly what a default arm meaning "location request" did to the sex
 * offender search reports the feed had begun to carry.
 *
 * Only the location request pair is split further, and by the nested location's
 * type: the feed's kind alone does not say which of the two a row is, and
 * everything the screen varies between them varies as a pair.
 */
const toKind = (item: ActivityItem): ActivityKind => {
  switch (item.kind) {
    case 'REVERSE_LOOKUP_REPORT':
      return 'REVERSE_LOOKUP_REPORT';
    case 'SEX_OFFENDER_SEARCH_REPORT':
      return 'SEX_OFFENDER_SEARCH_REPORT';
    case 'LOCATION_REQUEST':
      return item.location?.type === 'FIND_BY_LINK' ? 'LOCATION_BY_LINK' : 'LOCATION_BY_NUMBER';
  }
};

/**
 * What the row is called.
 *
 * A link-type request is called by the name the member gave it; a number-type one
 * and a reverse lookup report by the number they concern. A sex offender search
 * report is called by nothing here: the feed publishes no name for the record, so
 * the row is titled by what it is, in the component that has the copy.
 */
const toTitle = (kind: ActivityKind, item: ActivityItem): string => {
  switch (kind) {
    case 'LOCATION_BY_LINK':
      return item.location?.linkName ?? '';
    case 'LOCATION_BY_NUMBER':
    case 'REVERSE_LOOKUP_REPORT':
      return item.phone ?? '';
    case 'SEX_OFFENDER_SEARCH_REPORT':
      return '';
  }
};

/** One feed item as a row. */
const toActivityRow = (item: ActivityItem): ActivityRow => {
  const kind = toKind(item);

  return {
    id: item.id,
    kind,
    status: toStatus(item.status),
    title: toTitle(kind, item),
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
 * Nothing is sorted here. The feed is ordered by recency across all three of its
 * kinds, and a sort inside one page could only ever contradict that — the pages
 * after this one are not in hand to sort against.
 */
export const toActivityRows = (items: ActivityItem[]): ActivityRow[] => items.map(toActivityRow);
