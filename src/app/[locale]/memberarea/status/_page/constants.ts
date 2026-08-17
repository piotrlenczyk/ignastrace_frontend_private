import type { ActivityStatus } from './activity-row';

export const INITIAL_SHOW_COUNT = 5;

export const DATE_FORMAT_OPTIONS = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
} as const;

/*
 * What the status badge looks like, and what it says. Both are keyed on the
 * activity list's own status vocabulary rather than on either source's, so a row
 * lands on the same badge whichever source answered for it.
 */

export const STATUS_CLASSES = {
  READY: 'badge-located',
  LOCATED: 'badge-located',
  REJECTED: 'badge-rejected',
  PENDING: 'badge-pending',
} as const satisfies Record<ActivityStatus, string>;

export const STATUS_LABEL_KEYS = {
  READY: 'ready_status',
  LOCATED: 'located_status',
  REJECTED: 'rejected_status',
  PENDING: 'pending_status',
} as const satisfies Record<ActivityStatus, string>;
