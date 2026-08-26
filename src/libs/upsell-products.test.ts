import { describe, expect, it } from 'vitest';

import type { paymentsSchemas } from '@/network/payments-api/payments-api-server-client';

import {
  creditProductFor,
  ownsAnyUpsell,
  resolveUpsellProduct,
  UPSELL_CREDIT_PRODUCTS,
  UPSELL_PRODUCT_SLUGS,
  type UpsellProductKey,
} from './upsell-products';

/*
 * The specification types a product's metadata opaquely — `Record<string, never>`
 * — so a fixture shaped like the real payload states its keys through one cast
 * here rather than in every case. It also takes `unknown`, because two of the
 * cases below are about a payload that is not the shape the specification
 * promises at all.
 */
const opaque = (bag: unknown) => bag as Record<string, never>;

const price = (amount = 1995, currency = 'USD'): paymentsSchemas['OneOffPriceResponseDto'] => ({
  id: `price-${currency.toLowerCase()}`,
  currency,
  amount,
  provider: 'stripe',
  descriptor: 'IGNASTRACE.COM',
  providerAccount: {
    id: 'acct-uuid',
    provider: 'stripe',
    providerId: 'acct_stripe_1',
    name: 'Ignastrace',
    countryCode: 'US',
    configuration: opaque({ publicKey: 'pk_test_upsell' }),
  },
});

const product = ({
  id = 'product-uuid',
  metadata,
  withPrice = true,
  amount,
}: {
  id?: string;
  metadata?: unknown;
  withPrice?: boolean;
  amount?: number;
} = {}): paymentsSchemas['GetUpsellProductResponseDto'] => ({
  id,
  sku: 'upsell_1',
  campaign: 'default',
  priority: 1,
  ...(withPrice ? { price: price(amount) } : {}),
  ...(metadata === undefined ? {} : { metadata: opaque(metadata) }),
});

const SLUG = UPSELL_PRODUCT_SLUGS.unlimited_pdf_downloads;

describe('resolveUpsellProduct', () => {
  it('resolves the row carrying the slug the key maps to', () => {
    const wanted = product({ id: 'wanted', metadata: { productSlug: SLUG } });

    const resolved = resolveUpsellProduct(
      [product({ id: 'other', metadata: { productSlug: 'something-else' } }), wanted],
      'unlimited_pdf_downloads',
    );

    expect(resolved).toBe(wanted);
  });

  it('resolves the price alongside the row, so a caller never reads an absent amount', () => {
    const resolved = resolveUpsellProduct(
      [product({ metadata: { productSlug: SLUG }, amount: 4900 })],
      'unlimited_pdf_downloads',
    );

    expect(resolved?.price.amount).toBe(4900);
    expect(resolved?.price.currency).toBe('USD');
  });

  it('resolves nothing when no row carries the mapped slug', () => {
    const resolved = resolveUpsellProduct(
      [product({ metadata: { productSlug: 'something-else' } })],
      'unlimited_pdf_downloads',
    );

    expect(resolved).toBeUndefined();
  });

  it('resolves nothing from an empty response', () => {
    expect(resolveUpsellProduct([], 'unlimited_pdf_downloads')).toBeUndefined();
  });

  it('resolves nothing from a row that matches the slug but carries no price', () => {
    const resolved = resolveUpsellProduct(
      [product({ metadata: { productSlug: SLUG }, withPrice: false })],
      'unlimited_pdf_downloads',
    );

    expect(resolved).toBeUndefined();
  });

  it.each([
    ['absent', undefined],
    ['null', null],
    ['a string', 'unlimited_pdf_downloads'],
    ['an array', [{ productSlug: SLUG }]],
    ['an object with no productSlug', { planName: 'FOUR_WEEKS' }],
    ['an object whose productSlug is not a string', { productSlug: 7 }],
  ])('skips a row whose metadata is %s rather than throwing', (_case, metadata) => {
    const wanted = product({ id: 'wanted', metadata: { productSlug: SLUG } });

    expect(resolveUpsellProduct([product({ id: 'odd', metadata })], 'unlimited_pdf_downloads')).toBeUndefined();
    expect(resolveUpsellProduct([product({ id: 'odd', metadata }), wanted], 'unlimited_pdf_downloads')).toBe(wanted);
  });

  it('resolves the first of several rows carrying the same slug', () => {
    const first = product({ id: 'first', metadata: { productSlug: SLUG } });
    const second = product({ id: 'second', metadata: { productSlug: SLUG } });

    expect(resolveUpsellProduct([first, second], 'unlimited_pdf_downloads')).toBe(first);
    expect(resolveUpsellProduct([second, first], 'unlimited_pdf_downloads')).toBe(second);
  });

  it('resolves the first priced row when an unpriced one carries the same slug first', () => {
    const priced = product({ id: 'priced', metadata: { productSlug: SLUG } });

    const resolved = resolveUpsellProduct(
      [product({ id: 'unpriced', metadata: { productSlug: SLUG }, withPrice: false }), priced],
      'unlimited_pdf_downloads',
    );

    expect(resolved).toBe(priced);
  });

  /*
   * The state every key is in today: the payments instance publishes one upsell
   * product and the map points every legacy key at it. This case fails the day
   * a key is added without a slug beside it.
   */
  it('resolves every legacy upsell key against the single product the payments instance publishes', () => {
    const keys = Object.keys(UPSELL_PRODUCT_SLUGS) as UpsellProductKey[];

    expect(keys).toHaveLength(7);

    keys.forEach((key) => {
      const only = product({ metadata: { productSlug: UPSELL_PRODUCT_SLUGS[key] } });

      expect(resolveUpsellProduct([only], key)).toBe(only);
    });
  });
});

describe('the credit-balance product a legacy upsell key names', () => {
  it.each([
    ['data_leaks', 'DATA_LEAKS'],
    ['sex_offenders', 'SEX_OFFENDERS'],
    ['social_networks', 'SOCIAL_NETWORKS'],
    ['sex_offenders_search', 'SEX_OFFENDERS_SEARCH'],
  ] as const)('names %s as the new API’s %s', (key, product) => {
    expect(creditProductFor(key)).toBe(product);
  });

  /*
   * Each of these is a fact about the upstream rather than a gap. Unlimited PDF
   * downloads is an entitlement and not a balance; the `/success` screen's two
   * extras have no counterpart in the new API at all.
   */
  it.each(['unlimited_pdf_downloads', 'scan_pro', 'support_hotline'] as const)(
    'names nothing for %s, which the new API holds no balance for',
    (key) => {
      expect(creditProductFor(key)).toBeUndefined();
    },
  );

  /*
   * Both maps are exhaustive over the same union and sit side by side, so adding
   * an upsell key is a build failure beside them. This case fails the day one is
   * added without an answer in each.
   */
  it('answers for every legacy upsell key, as the slug map does', () => {
    const keys = Object.keys(UPSELL_PRODUCT_SLUGS) as UpsellProductKey[];

    expect(Object.keys(UPSELL_CREDIT_PRODUCTS).sort()).toEqual([...keys].sort());
  });
});

/*
 * The purchased-products response is the catalogue's shape with a count added, so
 * its fixture extends the builder above rather than restating it.
 */
const purchased = ({
  purchasedCount = 1,
  ...rest
}: {
  id?: string;
  metadata?: unknown;
  withPrice?: boolean;
  amount?: number;
  purchasedCount?: number;
} = {}): paymentsSchemas['GetPurchasedUpsellProductResponseDto'] => ({
  ...product(rest),
  purchasedCount,
});

const SUCCESS_KEYS: UpsellProductKey[] = ['scan_pro', 'support_hotline'];
const SCAN_PRO_SLUG = UPSELL_PRODUCT_SLUGS.scan_pro;

describe('ownsAnyUpsell', () => {
  it('answers owned for a row carrying a mapped slug with one purchase', () => {
    expect(ownsAnyUpsell([purchased({ metadata: { productSlug: SCAN_PRO_SLUG } })], SUCCESS_KEYS)).toBe(true);
  });

  it('answers owned for a row carrying a mapped slug with several purchases', () => {
    expect(
      ownsAnyUpsell([purchased({ metadata: { productSlug: SCAN_PRO_SLUG }, purchasedCount: 4 })], SUCCESS_KEYS),
    ).toBe(true);
  });

  it('answers not owned for a row carrying a mapped slug that has never been bought', () => {
    expect(
      ownsAnyUpsell([purchased({ metadata: { productSlug: SCAN_PRO_SLUG }, purchasedCount: 0 })], SUCCESS_KEYS),
    ).toBe(false);
  });

  it('answers not owned when no row carries a mapped slug', () => {
    expect(ownsAnyUpsell([purchased({ metadata: { productSlug: 'something-else' } })], SUCCESS_KEYS)).toBe(false);
  });

  it('answers not owned for an empty response', () => {
    expect(ownsAnyUpsell([], SUCCESS_KEYS)).toBe(false);
  });

  it('answers not owned when the caller names no keys at all', () => {
    expect(ownsAnyUpsell([purchased({ metadata: { productSlug: SCAN_PRO_SLUG } })], [])).toBe(false);
  });

  it.each([
    ['absent', undefined],
    ['null', null],
    ['a string', 'scan_pro'],
    ['an array', [{ productSlug: SCAN_PRO_SLUG }]],
    ['an object with no productSlug', { planName: 'FOUR_WEEKS' }],
    ['an object whose productSlug is not a string', { productSlug: 7 }],
  ])('skips a row whose metadata is %s rather than throwing', (_case, metadata) => {
    expect(ownsAnyUpsell([purchased({ metadata })], SUCCESS_KEYS)).toBe(false);

    expect(
      ownsAnyUpsell([purchased({ metadata }), purchased({ metadata: { productSlug: SCAN_PRO_SLUG } })], SUCCESS_KEYS),
    ).toBe(true);
  });

  /*
   * The screen fails closed on an unreadable count: re-selling an extra to
   * somebody who already paid for it is the one wrong answer that costs money,
   * so an absent response is treated exactly as ownership.
   */
  it('answers owned for an absent response, so a caller that cannot read the count fails closed', () => {
    expect(ownsAnyUpsell(undefined, SUCCESS_KEYS)).toBe(true);
  });

  it('is an OR over the keys, so one purchase against either answers owned', () => {
    const bought = (key: UpsellProductKey) => purchased({ metadata: { productSlug: UPSELL_PRODUCT_SLUGS[key] } });

    expect(ownsAnyUpsell([bought('scan_pro')], SUCCESS_KEYS)).toBe(true);
    expect(ownsAnyUpsell([bought('support_hotline')], SUCCESS_KEYS)).toBe(true);
  });

  it('reads the slug map rather than a slug of its own, so a key it is not asked about is ignored', () => {
    const rows = [purchased({ metadata: { productSlug: UPSELL_PRODUCT_SLUGS.scan_pro } })];

    expect(ownsAnyUpsell(rows, ['scan_pro'])).toBe(true);
    expect(ownsAnyUpsell(rows, [])).toBe(false);
  });
});
