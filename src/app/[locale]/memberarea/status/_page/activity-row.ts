/*
 * The activity list's own view of a row, and the one type its components read.
 *
 * The list is composed from two sources, and this is what both are mapped onto.
 * It is deliberately not an adapter onto either shape — neither source's model is
 * the target — so a row component, an icon and the status badge never has to know
 * which source a row arrived from. The record on the two-source list says why the
 * second source is still read and what has to be published before it can go; the
 * mapping onto this type is the seam that goes with it.
 */

/**
 * What a row is about.
 *
 * The two Location request types are separate kinds rather than one kind with a
 * type beside it, because everything that varies between them varies as a pair:
 * the icon, how the row is titled, where it leads, and whether it offers a retry.
 */
export type ActivityKind = 'LOCATION_BY_LINK' | 'LOCATION_BY_NUMBER' | 'REVERSE_LOOKUP_REPORT' | 'SEX_OFFENDER_REPORT';

/**
 * How far a row has got. One vocabulary for both sources: the new API states its
 * three in upper case, the legacy source states the same three in lower case and
 * adds a fourth for a report that has been produced.
 */
export type ActivityStatus = 'PENDING' | 'LOCATED' | 'REJECTED' | 'READY';

/** One line of the member's activity, whichever source answered for it. */
export type ActivityRow = {
  /** How the row's destination screen is reached — an id in its own source's terms. */
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
 * Whether a row has something to open. The other two states have produced nothing
 * yet, so their rows are not navigable — which is also what decides whether a
 * pending Location request offers its retry instead.
 */
export const isSettled = (status: ActivityStatus) => status === 'LOCATED' || status === 'READY';
