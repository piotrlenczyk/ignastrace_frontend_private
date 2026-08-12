export const INITIAL_SHOW_COUNT = 5;

export const DATE_FORMAT_OPTIONS = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
} as const;

export const STATUS_CLASSES = {
  ready: 'badge-located',
  located: 'badge-located',
  rejected: 'badge-rejected',
  pending: 'badge-pending',
} as const;
