import { deleteCookie, getCookie, setCookie } from 'cookies-next/client';
import { z } from 'zod';

/**
 * The checkout attempt: one visitor's run at buying a subscription, as the
 * funnel records it.
 *
 * It holds the two answers the funnel asks for and nothing else — the plan
 * chosen on the homepage, and the currency chosen on the checkout screen. Both
 * are read back on every visit to checkout, which is the rule this module lives
 * by: a field lands here on the day something reads it, never before. See
 * docs/adr/0019-the-parked-checkout-island.md, which removed an earlier version
 * of this module precisely for holding fields nothing wrote or read.
 *
 * The plan is stated in the funnel's own vocabulary rather than the payments
 * catalogue's product names, so renaming a catalogue product does not invalidate
 * cookies already sitting in browsers. Mapping one to the other is
 * `getPlanProductName`'s job, in the pricing reader.
 *
 * Writes happen in the browser and the value is a plain readable JSON object, so
 * a plan and a currency can be set by hand while testing a market. It is a
 * session cookie: the attempt belongs to the visit, and someone on a shared
 * computer does not hand their choices to the next person.
 */
export const CHECKOUT_COOKIE_KEY = 'checkout';

export const FUNNEL_PLANS = ['trial', 'subscription'] as const;

const CheckoutDataSchema = z.object({
  plan: z.enum(FUNNEL_PLANS),
  currency: z.string().optional(),
});

export type CheckoutData = z.infer<typeof CheckoutDataSchema>;

/**
 * The plan a visitor chose, in the funnel's words.
 *
 * Inferred from the schema above rather than declared beside it, so what passes
 * validation and what passes the type-check cannot drift apart.
 */
export type FunnelPlan = CheckoutData['plan'];

/** The plan the funnel offers someone who has not answered the question. */
export const DEFAULT_FUNNEL_PLAN: FunnelPlan = 'trial';

/**
 * The attempt a cookie value describes, or none.
 *
 * A malformed value is indistinguishable from no cookie at all. The parse is
 * guarded rather than left to throw because a server component reads this before
 * rendering the screen where money changes hands: a hand-edited or truncated
 * cookie must cost the visitor their recorded choices, not the page.
 */
export const parseCheckoutData = (checkoutData?: string): CheckoutData | null => {
  if (!checkoutData) {
    return null;
  }

  try {
    const parsed = CheckoutDataSchema.safeParse(JSON.parse(checkoutData));

    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
};

export const getCheckoutCookie = () => parseCheckoutData(getCookie(CHECKOUT_COOKIE_KEY));

/**
 * Records what the visitor just answered, keeping what they answered before.
 *
 * The two writers answer different questions — the homepage the plan, the
 * checkout screen the currency — so every write reads the current value first
 * and neither can clobber the other's field. A write arriving with no attempt on
 * record states the plan the funnel defaults to, which is the plan the screen is
 * quoting anyway.
 */
export const setCheckoutCookie = (attempt: Partial<CheckoutData>) => {
  const current = getCheckoutCookie();

  setCookie(CHECKOUT_COOKIE_KEY, { plan: DEFAULT_FUNNEL_PLAN, ...current, ...attempt } satisfies CheckoutData);
};

/** The attempt is over, however it ended. */
export const deleteCheckoutCookie = () => deleteCookie(CHECKOUT_COOKIE_KEY);
