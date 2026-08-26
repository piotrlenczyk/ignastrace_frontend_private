import type { paymentsSchemas } from '@/network/payments-api/payments-api-server-client';

import { parseFunnelUpsellRecord } from './funnel-upsell-record';
import { resolveUpsellProduct } from './upsell-products';

/**
 * What a funnel confirmation screen reports to GTM, decided in one place.
 *
 * Three screens end a funnel run — `/success`, `/thank-you` and
 * `/lookup-thank-you` — and each of them pushes one purchase event. Which event,
 * what value, what currency, or nothing at all is the whole of the question, and
 * it is answered here: no network, no cookies and no React, so every case is
 * reachable from a test with plain fakes. This follows `resolveUpsellProduct` and
 * `upsell-unlock`, the two pure modules ADR 0029 and ADR 0030 added for the same
 * reason.
 *
 * What it replaces is the **mocked membership** of ADR 0013, which every one of
 * these screens priced from: one fabricated amount for every visitor, and the
 * currency `usd` whatever market they bought in. The worst of it was the visitor
 * who declined — the funnel's upsell steps are optional, and somebody who refused
 * every one of them was still reported as having spent the full invented upsell
 * amount.
 *
 * See docs/adr/0037-the-funnel-s-purchase-events-report-what-was-bought.md.
 */

/** Which of the two purchases a confirmation screen is reporting. */
export type FunnelPurchaseReport =
  /** The subscription itself. */
  | 'subscription'
  /** Whatever this funnel run bought on top of it. */
  | 'upsells';

/** The two events a funnel run can report, and the only two names either screen pushes. */
export type FunnelPurchaseEventName =
  /** The subscription itself was bought. */
  | 'purchase'
  /** Something was bought on top of it. */
  | 'upsell_purchase';

/** One event, ready for the data layer. */
export type FunnelPurchaseEvent = {
  event: FunnelPurchaseEventName;
  /** In major units, which is what the data layer is fed everywhere else. */
  value: number;
  currency: string;
};

export type FunnelPurchaseEventInputs = {
  reports: FunnelPurchaseReport;
  /**
   * The funnel's record of what was bought, exactly as the cookie holds it —
   * raw rather than parsed, so a record nothing here wrote is refused at this
   * seam rather than at a second one.
   */
  record: string | undefined;
  /**
   * The subscription record's own product price. The gate in front of each of
   * these screens already requires that record to exist, so this is absent only
   * where the payments service could not be asked at all.
   */
  subscriptionPrice: Pick<paymentsSchemas['GetPriceResponseDto'], 'amount' | 'currency'> | undefined;
  /** The payments upsell catalogue, or nothing where it could not be read. */
  catalogue: paymentsSchemas['GetUpsellProductResponseDto'][] | undefined;
};

/** Every amount either upstream publishes is in cents; the data layer is fed major units. */
const inMajorUnits = (cents: number) => cents / 100;

/**
 * What this funnel run's recorded purchases are worth, in cents.
 *
 * Each key is priced through the resolver every other upsell screen goes
 * through, and a key resolving to no priced row contributes nothing — the rule
 * ADR 0029 and ADR 0030 set, that an upsell with no resolvable price is skipped
 * and never priced from a fallback. A record that does not parse is worth
 * nothing for the same reason: there is no amount any upstream stands behind.
 */
const recordedUpsellAmount = (
  record: string | undefined,
  catalogue: paymentsSchemas['GetUpsellProductResponseDto'][] | undefined,
) =>
  (parseFunnelUpsellRecord(record) ?? []).reduce(
    (total, key) => total + (resolveUpsellProduct(catalogue ?? [], key)?.price.amount ?? 0),
    0,
  );

/**
 * The event a confirmation screen should push, or nothing at all.
 *
 * The subscription's own event is valued from the subscription record's product
 * price and keeps firing for every completed subscription. The upsell event is
 * valued from what this run actually bought, and is **not sent** where that comes
 * to nothing: a visitor who declined every step, a run whose record does not
 * parse, and a catalogue that prices none of it are all the same answer, because
 * reporting a sale of nothing is the mistake this module exists to end.
 *
 * The currency is the subscription row's in both cases. It is the one currency in
 * the run that a member demonstrably paid in, and pricing the two events in
 * different currencies would make the pair unaddable.
 *
 * A subscription nobody could read costs the event rather than the screen. The
 * amount would otherwise have to be invented, which is the whole complaint.
 */
export const decideFunnelPurchaseEvent = ({
  reports,
  record,
  subscriptionPrice,
  catalogue,
}: FunnelPurchaseEventInputs): FunnelPurchaseEvent | null => {
  if (!subscriptionPrice) {
    return null;
  }

  const currency = subscriptionPrice.currency.toUpperCase();

  if (reports === 'subscription') {
    return { event: 'purchase', value: inMajorUnits(subscriptionPrice.amount), currency };
  }

  const amount = recordedUpsellAmount(record, catalogue);

  return amount > 0 ? { event: 'upsell_purchase', value: inMajorUnits(amount), currency } : null;
};
