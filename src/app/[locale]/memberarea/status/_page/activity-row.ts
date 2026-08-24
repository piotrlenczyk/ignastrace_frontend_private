/*
 * The activity list's own view of a row, and the one type its components read.
 *
 * The feed answers for the list now, and this is what its items are mapped onto.
 * It is deliberately not an adapter onto that shape — the feed's model is not the
 * target — so a row component, an icon and the status badge state the list's own
 * vocabulary of kinds and of statuses and nothing of the API's. The record on
 * adopting the feed says what that vocabulary still describes and the feed does
 * not answer for; the mapping onto this type is the seam that goes with it.
 */

/**
 * What a row is about.
 *
 * The two Location request types are separate kinds rather than one kind with a
 * type beside it, because everything that varies between them varies as a pair:
 * the icon, how the row is titled, where it leads, and whether it offers a retry.
 *
 * The sex offender kind has no source filling it: the feed models two kinds and
 * that is not one of them. It stays because the icons, the descriptions and the
 * destination are still written for it, so restoring those rows the day the feed
 * carries them is a mapping rather than a re-modelling.
 */
export type ActivityKind = 'LOCATION_BY_LINK' | 'LOCATION_BY_NUMBER' | 'REVERSE_LOOKUP_REPORT' | 'SEX_OFFENDER_REPORT';

/**
 * How far a row has got. Four states for the two vocabularies the feed passes
 * through: a location request's three, plus one for a report that has been
 * produced. A report being generated is one still waiting, and one whose
 * generation failed is drawn the way a request the recipient turned down is.
 */
export type ActivityStatus = 'PENDING' | 'LOCATED' | 'REJECTED' | 'READY';

/** One line of the member's activity, whichever kind the feed answered with. */
export type ActivityRow = {
  /** How the row's destination screen is reached — the underlying record's own id. */
  id: string;
  kind: ActivityKind;
  status: ActivityStatus;
  /**
   * What the row is called, unformatted: the name the member gave a link-type
   * request, the number a number-type request or a reverse lookup is about, or
   * the name a sex offender report was produced for.
   *
   * Unformatted because a number is also what a retry is addressed to, and a
   * number formatted for reading is not one a query string can carry.
   */
  title: string;
  /** The address a located request resolved to. Absent in every other state. */
  address?: string;
  /** The ordering key. The list is most-recently-changed first, across all kinds. */
  updatedAt: string;
};

/**
 * What identifies a row to React.
 *
 * The kind is part of it because the id is the underlying record's own, in
 * whichever upstream holds it: two kinds are free to name their records the same
 * thing, and a list that renders both would then be keyed on a collision. Stated
 * once here because more than one component maps rows onto items.
 */
export const rowKey = (row: ActivityRow) => `${row.kind}-${row.id}`;

/**
 * Whether a row has something to open. The other two states have produced nothing
 * yet, so their rows are not navigable — which is also what decides whether a
 * pending Location request offers its retry instead.
 */
export const isSettled = (status: ActivityStatus) => status === 'LOCATED' || status === 'READY';
