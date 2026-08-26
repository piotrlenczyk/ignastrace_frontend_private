import { deleteCookie, getCookie, setCookie } from 'cookies-next/client';
import { z } from 'zod';

import { UPSELL_PRODUCT_SLUGS, type UpsellProductKey } from './upsell-products';

/**
 * The funnel's record of what a visitor bought on top of their subscription.
 *
 * One funnel run's upsell purchases, in the order they were made, written by the
 * step that charged for each of them and read once by the confirmation screen at
 * the end of the run. Nothing else in the application knew what a visitor bought
 * during a funnel: the purchase happens in the browser and the confirmation
 * screen renders on the server, so this cookie is the only thing that passes
 * between them.
 *
 * It is modelled on the **checkout attempt** in `checkout-cookie.ts` — a session
 * cookie holding readable JSON, written from the browser through the same helper,
 * parsed behind a schema, and a malformed value indistinguishable from no cookie
 * at all — and it is deliberately a **separate** cookie rather than a field on
 * that one. The checkout island deletes the attempt on payment success, and the
 * funnel's upsell steps run after that point; a field here would mean
 * resurrecting a record that had just been ended on purpose, and would leave the
 * checkout screen reading an attempt that is not one. This record means something
 * different: what this funnel run bought on top of the subscription.
 *
 * A session cookie, for the reason the attempt is one: the record belongs to the
 * visit, and somebody on a shared computer does not hand their purchases to the
 * next person's confirmation screen.
 *
 * See docs/adr/0037-the-funnel-s-purchase-events-report-what-was-bought.md.
 */
export const FUNNEL_UPSELL_COOKIE_KEY = 'funnel_upsells';

/**
 * The keys are the application's own upsell vocabulary, not payments catalogue
 * slugs — the reason the checkout attempt records a funnel plan rather than a
 * product name: renaming a catalogue row must not invalidate cookies already
 * sitting in browsers.
 *
 * Membership is read off the slug map, which is exhaustive over the key union, so
 * the vocabulary this validates against cannot drift from the vocabulary the rest
 * of the application speaks.
 */
const isUpsellProductKey = (key: unknown): key is UpsellProductKey =>
  typeof key === 'string' && key in UPSELL_PRODUCT_SLUGS;

const FunnelUpsellRecordSchema = z.array(z.custom<UpsellProductKey>(isUpsellProductKey));

/** What one funnel run bought on top of the subscription. */
export type FunnelUpsellRecord = z.infer<typeof FunnelUpsellRecordSchema>;

/**
 * The purchases a cookie value describes, or none.
 *
 * Guarded exactly as the checkout attempt's parse is, and for a sharper reason:
 * this is read during the server render of a screen somebody reaches seconds
 * after paying. A hand-edited, truncated or foreign value costs that visitor
 * their analytics event and nothing else — never the screen.
 *
 * The whole record is refused rather than repaired. One unrecognised entry means
 * the value did not come from this application, and half-reading it would report
 * a purchase from a payload nothing here wrote.
 */
export const parseFunnelUpsellRecord = (record?: string): FunnelUpsellRecord | null => {
  if (!record) {
    return null;
  }

  try {
    const parsed = FunnelUpsellRecordSchema.safeParse(JSON.parse(record));

    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
};

/**
 * Records an upsell this funnel run has just been charged for, keeping the ones
 * before it.
 *
 * Called only where a purchase actually succeeded, and only from a funnel screen.
 * The member area's unlock surfaces buy the same products through the same hook
 * and must not call this: their purchases have nothing to do with a funnel
 * confirmation screen, and reporting one as part of a run it had no part in is
 * the shape of mistake this whole record exists to end.
 */
export const recordFunnelUpsell = (key: UpsellProductKey) => {
  const current = parseFunnelUpsellRecord(getCookie(FUNNEL_UPSELL_COOKIE_KEY)) ?? [];

  setCookie(FUNNEL_UPSELL_COOKIE_KEY, [...current, key] satisfies FunnelUpsellRecord);
};

/** The run has been reported. What it bought is nobody's business afterwards. */
export const deleteFunnelUpsellRecord = () => deleteCookie(FUNNEL_UPSELL_COOKIE_KEY);
