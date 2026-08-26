import type { UpsellProduct, UpsellProductKey } from '@/libs/upsell-products';

/**
 * The two extras this screen sells.
 *
 * The ownership guard in front of the screen and the offers rendered on it read
 * this one list, so a third extra is one edit here. The pure module's own test
 * names the pair again rather than importing it — a test of `src/libs` reaching
 * into `src/app` would be the worse trade.
 */
export type SuccessUpsellKey = Extract<UpsellProductKey, 'scan_pro' | 'support_hotline'>;

export const SUCCESS_UPSELL_KEYS: SuccessUpsellKey[] = ['scan_pro', 'support_hotline'];

/**
 * One offer on this screen: the payments row that carries the price, and the
 * legacy key beside it rather than folded into it.
 *
 * The row is what is displayed and what is charged — the card sends `price.id`
 * off it — while the key is what names the extra to the translations and to the
 * icon. This replaces the screen's own local `Product` type, which restated an
 * amount and a currency the payments row already carries.
 */
export type UpsellOffer = {
  key: SuccessUpsellKey;
  product: UpsellProduct;
};
