import type { CreditProduct } from '@/libs/upsell-unlock';
import type { paymentsSchemas } from '@/network/payments-api/payments-api-server-client';

/**
 * The application's word for an upsell, and it stays the legacy one.
 *
 * The translation namespaces, the one purchase that is still a legacy call — the
 * standalone sex-offender search — and the screens' own props all speak this
 * vocabulary, and none of them moved when the price did or when the charge
 * followed it. So the key identifies an upsell everywhere in this application,
 * and each upstream's own identity for the same thing is reached through one of
 * the two maps below rather than spread around:
 * the payments service's slug, and the new API's credit-balance product.
 *
 * The union lives here rather than in the `/success` screen's legacy `Product`
 * type, which now reads it from here: the vocabulary belongs to the concept, not
 * to one screen that happens to have declared it first.
 */
export type UpsellProductKey =
  | 'data_leaks'
  | 'scan_pro'
  | 'sex_offenders'
  | 'sex_offenders_search'
  | 'social_networks'
  | 'support_hotline'
  | 'unlimited_pdf_downloads';

/**
 * A payments upsell row that carries a price — the only kind a screen may offer.
 *
 * The specification declares `price` optional, which is honest about the upstream
 * and useless at a call site: a card cannot render an amount it has to check for
 * first. `resolveUpsellProduct` is where the check happens, once, and this is the
 * shape it hands back.
 */
export type UpsellProduct = paymentsSchemas['GetUpsellProductResponseDto'] & {
  price: paymentsSchemas['OneOffPriceResponseDto'];
};

/**
 * Every legacy upsell key, and the payments product slug it is looked up by.
 *
 * `Record<UpsellProductKey, string>` on purpose: the map is exhaustive over the
 * key union, so adding a key to `Product` is a build failure here rather than an
 * upsell that silently resolves to nothing.
 *
 * **Every entry is the same placeholder today.** The payments instance is a
 * resumewise development one (ADR 0016) publishing a single upsell product, so
 * all seven keys point at it: every screen shows that one product's price and,
 * since ADR 0030, charges it too — so the amount displayed and the amount charged
 * now agree, and what they agree on is one placeholder rather than the upsell the
 * member chose. The credit the backend grants therefore need not correspond to
 * the section that was bought. The day the backend publishes real Ignastrace
 * upsell products, this constant is the change and there is no other.
 *
 * `scan_pro` and `support_hotline` are looked up through this map too, since
 * ADR 0032 moved the `/success` screen's two extras onto the payments catalogue:
 * both the price on each card and the ownership guard in front of the screen
 * resolve through the slug here.
 */
export const UPSELL_PRODUCT_SLUGS: Record<UpsellProductKey, string> = {
  scan_pro: 'resume-ai-review',
  support_hotline: 'resume-ai-review',
  data_leaks: 'resume-ai-review',
  sex_offenders: 'resume-ai-review',
  sex_offenders_search: 'resume-ai-review',
  unlimited_pdf_downloads: 'resume-ai-review',
  social_networks: 'resume-ai-review',
};

/**
 * Every legacy upsell key, and the new API's credit-balance product it names — or
 * nothing, where the new API models no balance for it.
 *
 * The sibling of the slug map above, and deliberately beside it: one says how the
 * payments service identifies an upsell, the other how the new API does, and a
 * reader comparing the two can see at a glance which keys are known to both.
 *
 * `Record<UpsellProductKey, CreditProduct | null>` for the same reason the slug
 * map is exhaustive: adding a key to the union is a build failure next to both
 * maps rather than an upsell that silently resolves to nothing.
 *
 * The four `null`s are each a fact rather than an omission. `unlimited_pdf_downloads`
 * is an entitlement on the current-user response, not a balance — the one concept
 * both upstreams share, and it is bought outright and never spent.
 * `sex_offenders_search` belongs to the standalone search, whose purchase stays on
 * the legacy call because that call also creates the search report and answers
 * with its identifier. `scan_pro` and `support_hotline` are bought on the payments
 * service since ADR 0032 and have no counterpart in the new API at all, so there
 * is nothing to spend after that purchase. See ADR 0030 and ADR 0032.
 */
export const UPSELL_CREDIT_PRODUCTS: Record<UpsellProductKey, CreditProduct | null> = {
  scan_pro: null,
  support_hotline: null,
  data_leaks: 'DATA_LEAKS',
  sex_offenders: 'SEX_OFFENDERS',
  sex_offenders_search: null,
  unlimited_pdf_downloads: null,
  social_networks: 'SOCIAL_NETWORKS',
};

/**
 * The credit-balance product an upsell key names, or nothing.
 *
 * A caller reads the map through here so that "does this upsell have a credit
 * balance behind it" is one question with one answer: a key that resolves takes
 * the spend-first sequence, and a key that does not is bought outright.
 */
export const creditProductFor = (key: UpsellProductKey): CreditProduct | undefined =>
  UPSELL_CREDIT_PRODUCTS[key] ?? undefined;

/*
 * The generated type for a product's metadata is `Record<string, never>`, so
 * reading a field off it yields `never` and states nothing true about the value.
 * The bag is narrowed here by hand instead — no `any`, and no edit to the
 * generated specification, which is regenerated from the upstream.
 *
 * Everything that is not an object carrying a string `productSlug` is simply not
 * a match, including the shapes the specification says cannot arrive. A response
 * that is wrong should cost an upsell, not throw a page at somebody.
 */
const productSlug = (metadata: paymentsSchemas['GetUpsellProductResponseDto']['metadata']): string | undefined => {
  if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) {
    return undefined;
  }

  const slug = (metadata as Record<string, unknown>).productSlug;

  return typeof slug === 'string' ? slug : undefined;
};

/**
 * The upsell product a screen may offer for a legacy key, or nothing.
 *
 * This is the only place that knows how a payments upsell row is identified. The
 * five screens reading `/products/upsell` — the three funnel steps, the member
 * area's unlock dialog and the order-success screen's two extras — ask through
 * here and branch on `undefined`. The row they get back is also the row that is
 * charged: since ADR 0030 the purchase sends `price.id` off it.
 *
 * `undefined` means one thing to all of them: **do not offer this**. No row
 * carries the mapped slug, or the row that does carries no price, and either way
 * there is no amount any upstream stands behind. A funnel step moves the visitor
 * to the next one and the dialog does not render; nothing is guessed at. See ADR
 * 0029 for why absence is a skip rather than a fallback price.
 *
 * Several rows carrying one slug is the state every key is in today, and the
 * first priced one wins — deterministic, in the order the service returned.
 */
export const resolveUpsellProduct = (
  products: paymentsSchemas['GetUpsellProductResponseDto'][],
  key: UpsellProductKey,
): UpsellProduct | undefined => {
  const slug = UPSELL_PRODUCT_SLUGS[key];

  return products.find(
    (product): product is UpsellProduct => productSlug(product.metadata) === slug && product.price !== undefined,
  );
};

/**
 * A payments upsell row the caller has bought, and how many times.
 *
 * The catalogue's shape with a count added, and the only thing in the system that
 * answers anything at all about `scan_pro` and `support_hotline` — the new API
 * models neither, which is why both keep their `null` in the credit map above.
 */
export type PurchasedUpsellProduct = paymentsSchemas['GetPurchasedUpsellProductResponseDto'];

/**
 * Whether the payments service's purchased-products response says the caller
 * already owns any of these upsells.
 *
 * **This endpoint is asked, and that reverses ADR 0030.** That record and the
 * glossary beside it said it never would be, because every payments call is
 * raised as the shared technical account of ADR 0023 and its per-user answers are
 * that account's. The objection is not answered — it is accepted, in one place
 * and for one reason: the `/success` screen sells two extras that no other
 * upstream knows anything about, and the alternative was the fixture the screen
 * was gating on. ADR 0032 records the trade, and names the symptom: one purchase
 * by anybody raises the count for everybody, and from that moment every member is
 * sent past the offer instead of being shown it.
 *
 * The slug each key is looked up by comes from `UPSELL_PRODUCT_SLUGS`, so the day
 * real products are published there is still exactly one constant to change.
 *
 * It is an **OR** over the keys at a count of one or more, reproducing what the
 * screen did with the composed member's list of extras: a member who bought one
 * of the two is never offered the other again.
 *
 * **An absent response answers owned.** A count nobody could read is not a zero,
 * and the wrong answer in that direction re-sells an extra to somebody who has
 * already paid for it. A caller that wants to tell the two apart branches on the
 * absence itself first; one that does not still fails closed.
 */
export const ownsAnyUpsell = (purchased: PurchasedUpsellProduct[] | undefined, keys: UpsellProductKey[]): boolean => {
  if (!purchased) {
    return true;
  }

  const slugs = new Set(keys.map((key) => UPSELL_PRODUCT_SLUGS[key]));

  return purchased.some((row) => {
    const slug = productSlug(row.metadata);

    return slug !== undefined && slugs.has(slug) && row.purchasedCount > 0;
  });
};
