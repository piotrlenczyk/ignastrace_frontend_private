import type { paymentsSchemas } from '@/network/payments-api/payments-api-server-client';

/**
 * The application's word for an upsell, and it stays the legacy one.
 *
 * The purchase (`POST /reverse_lookups_upsellings`), the ownership check on the
 * member (`member.upsellings`) and the translation namespaces all speak this
 * vocabulary, and none of them move with the price. So the key identifies an
 * upsell everywhere in this application, and the payments service's own identity
 * for the same thing is reached through the map below rather than spread around.
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
 * all seven keys point at it and all seven screens show that one product's price
 * while charging the legacy catalogue's — the divergence ADR 0029 records. The
 * day the backend publishes real Ignastrace upsell products, this constant is
 * the change and there is no other.
 *
 * `scan_pro` and `support_hotline` belong to the `/success` screen's separate
 * legacy endpoint and no caller here asks for them. They appear because the map
 * is exhaustive, not because they are in scope.
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
 * four screens reading `/products/upsell` — the three funnel steps and the
 * member area's unlock dialog — ask through here and branch on `undefined`.
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
