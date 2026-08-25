import { describe, expect, it } from 'vitest';

import type { paymentsSchemas } from '@/network/payments-api/payments-api-server-client';

import {
  creditProductFor,
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
  ] as const)('names %s as the new API’s %s', (key, product) => {
    expect(creditProductFor(key)).toBe(product);
  });

  /*
   * Each of these is a fact about the upstream rather than a gap. Unlimited PDF
   * downloads is an entitlement and not a balance; the standalone search and the
   * `/success` screen's two extras have no counterpart in the new API at all.
   */
  it.each(['unlimited_pdf_downloads', 'sex_offenders_search', 'scan_pro', 'support_hotline'] as const)(
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
