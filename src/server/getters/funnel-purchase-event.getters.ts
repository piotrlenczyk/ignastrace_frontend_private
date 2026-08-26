import { cookies } from 'next/headers';

import { decideFunnelPurchaseEvent, type FunnelPurchaseReport } from '@/libs/funnel-purchase-event';
import { FUNNEL_UPSELL_COOKIE_KEY } from '@/libs/funnel-upsell-record';

import { getSubscription } from './subscription.getters';
import { getUpsellProducts } from './upsell-products.getters';

/**
 * The purchase event a funnel confirmation screen should push, or nothing at all.
 *
 * The three screens that end a funnel run — `/success`, `/thank-you` and
 * `/lookup-thank-you` — read this and render the event it hands back. Everything
 * it does is fetching: the decision itself is `decideFunnelPurchaseEvent`, which
 * holds no network, no cookies and no React and is where every case is tested.
 *
 * The subscription is the one both events are priced in, and the gate above each
 * of these screens already required it to exist (ADR 0036) — this read is the
 * same one, made again because that gate does not hand it on. The catalogue is
 * read **only** where there are upsells to price against it, so the screen
 * reporting the subscription alone costs one payments call rather than two.
 *
 * See docs/adr/0037-the-funnel-s-purchase-events-report-what-was-bought.md.
 */
export const getFunnelPurchaseEvent = async (reports: FunnelPurchaseReport) => {
  const [requestCookies, { data: subscription }, catalogue] = await Promise.all([
    cookies(),
    getSubscription(),
    reports === 'upsells' ? getUpsellProducts() : undefined,
  ]);

  return decideFunnelPurchaseEvent({
    reports,
    record: requestCookies.get(FUNNEL_UPSELL_COOKIE_KEY)?.value,
    subscriptionPrice: subscription?.product.price,
    catalogue,
  });
};
