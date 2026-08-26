import type { IconName } from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';
import type { components } from '@/network/api/api';

/*
 * The screen's own view of a notification, and the whole of the seam between the
 * notification centre and the screen that shows it.
 *
 * The new API renders a notification itself — a title and a body, composed
 * upstream — so the screen no longer assembles a sentence out of a translation
 * key, a location type and a phone number. What is left to decide is where a row
 * leads, which icon it draws, and whether it is unread; all three are decided
 * here, and nothing else on the screen decides anything.
 *
 * A pure mapping and nothing else: no client, no cache, no ordering. That is
 * what makes the rules provable without rendering a screen, and it is why the
 * read-marking write is thin — it is handed the ids this module selected.
 */

type NotificationItem = components['schemas']['NotificationCenterItemResponse'];
type TargetType = components['schemas']['TargetResponse']['targetType'];

/** One line of the member's notification centre. */
export type NotificationRow = {
  id: string;
  /** The copy the backend composed, shown as it was written. */
  title: string;
  body: string;
  /** When it arrived, as the API stated it. */
  createdAt: string;
  /** Whether it still carries the unread mark. */
  isUnread: boolean;
  icon: IconName;
  /** Where the row leads, when it leads anywhere. */
  href?: string;
};

/**
 * What the screen does with a notification's target, keyed on the target type.
 *
 * One map answers both questions a target decides, so a row's icon and its
 * destination cannot disagree — an icon promising a report on a row that opens a
 * location request is the failure this shape makes impossible.
 *
 * It is deliberately partial over the API's twenty-three target types. Only two
 * of them name a screen this application has, and the backend adding a third is
 * part of the contract rather than an anomaly: an unmapped type falls through to
 * a plain row below. Typing it against that enumeration is what still refuses a
 * key that is not a target type at all.
 */
const TARGETS: Partial<Record<TargetType, { icon: IconName; route: string }>> = {
  LocationRequest: { icon: 'pin-location', route: ROUTES.MEMBER.STATUS.DETAIL },
  ReverseLookupReport: { icon: 'phone', route: ROUTES.MEMBER.STATUS.REPORT },
};

/**
 * What a row with nowhere to go draws. The same icon a notification about
 * anything the screen has no picture for draws, which is the honest answer:
 * something happened that this screen cannot illustrate.
 */
const FALLBACK_ICON: IconName = 'alert-circle';

/**
 * The `icon` the API publishes is deliberately not read. It is an unconstrained
 * nullable string with no stated vocabulary — it may be one of this
 * application's icon names, one of the backend's, or a URL — so a lookup on it
 * would resolve to the fallback for everything while reading as though it did
 * something. The question is asked of the backend instead.
 */
const toNotificationRow = (item: NotificationItem): NotificationRow => {
  const target = item.context.target;
  const mapped = target ? TARGETS[target.targetType] : undefined;

  return {
    id: item.id,
    title: item.title,
    body: item.body,
    createdAt: item.createdAt,
    /*
     * `isRead` is optional and nullable where the concept is binary, so it has
     * three states for two answers. A notification is unread unless the API says
     * read in as many words — which keeps the behaviour the legacy shape had, and
     * fails loudly rather than silently: a field the backend never populates
     * leaves the badge standing and the write repeating with the same ids, where
     * the opposite reading would mark nothing and explain nothing.
     */
    isUnread: item.context.isRead !== true,
    icon: mapped?.icon ?? FALLBACK_ICON,
    href: mapped && target ? `${mapped.route}?id=${target.targetId}` : undefined,
  };
};

/**
 * A page of the centre as rows, in the order the API listed them.
 *
 * Nothing is sorted. The page after this one is not in hand to sort against, so
 * a sort here could only contradict the order the pages arrive in.
 */
export const toNotificationRows = (items: NotificationItem[]): NotificationRow[] => items.map(toNotificationRow);

/**
 * Which of the rows the member has been shown are still unread — the ids the
 * read-marking write is given.
 *
 * The write takes an explicit list and offers no "mark all", so "read" here means
 * "shown to you" rather than "everything you have": the pages actually loaded,
 * and nothing behind the cursor. An empty answer is what stops a request being
 * made at all.
 */
export const unreadNotificationIds = (rows: NotificationRow[]): string[] =>
  rows.filter((row) => row.isUnread).map((row) => row.id);
