import { describe, expect, it } from 'vitest';

import type { paymentsSchemas } from '@/network/payments-api/payments-api-server-client';

import { decideFunnelPurchaseEvent } from './funnel-purchase-event';
import { UPSELL_PRODUCT_SLUGS } from './upsell-products';

/*
 * The catalogue fixture is the upsell-products one, trimmed to what pricing an
 * event needs. Metadata is typed opaquely by the specification, so the slug a row
 * carries is stated through one cast here rather than in every case.
 */
const opaque = (bag: unknown) => bag as Record<string, never>;

const row = ({
  slug = UPSELL_PRODUCT_SLUGS.data_leaks,
  amount = 1995,
  currency = 'USD',
}: { slug?: string; amount?: number; currency?: string } = {}): paymentsSchemas['GetUpsellProductResponseDto'] => ({
  id: `product-${slug}`,
  sku: 'upsell_1',
  campaign: 'default',
  priority: 1,
  metadata: opaque({ productSlug: slug }),
  price: {
    id: 'price-uuid',
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
  },
});

/** The amount and currency the payments service holds for the subscription itself. */
const SUBSCRIPTION_PRICE = { amount: 5900, currency: 'EUR' };

const CATALOGUE = [row()];

/** Everything a screen hands the decision, with each case restating only its own input. */
const decide = (inputs: Partial<Parameters<typeof decideFunnelPurchaseEvent>[0]> = {}) =>
  decideFunnelPurchaseEvent({
    reports: 'upsells',
    record: undefined,
    subscriptionPrice: SUBSCRIPTION_PRICE,
    catalogue: CATALOGUE,
    ...inputs,
  });

describe('the subscription’s own purchase event', () => {
  it('reports the subscription’s price, in major units', () => {
    expect(decide({ reports: 'subscription' })).toEqual({ event: 'purchase', value: 59, currency: 'EUR' });
  });

  it('keeps firing for a visitor who bought no upsell at all', () => {
    expect(decide({ reports: 'subscription', record: undefined, catalogue: undefined })).toEqual({
      event: 'purchase',
      value: 59,
      currency: 'EUR',
    });
  });

  it('ignores a record left over from a run whose upsell steps are switched off', () => {
    expect(decide({ reports: 'subscription', record: '["data_leaks","sex_offenders"]' })).toEqual({
      event: 'purchase',
      value: 59,
      currency: 'EUR',
    });
  });

  it('takes its currency from the subscription row rather than from the upsell catalogue', () => {
    expect(decide({ reports: 'subscription', subscriptionPrice: { amount: 100, currency: 'gbp' } })).toEqual({
      event: 'purchase',
      value: 1,
      currency: 'GBP',
    });
  });
});

describe('the funnel’s upsell purchase event', () => {
  it('sends nothing for a visitor who declined every upsell', () => {
    expect(decide({ record: undefined })).toBeNull();
  });

  it('sends nothing for a run that recorded an empty list', () => {
    expect(decide({ record: '[]' })).toBeNull();
  });

  it('reports the price of the one upsell that was bought', () => {
    expect(decide({ record: '["data_leaks"]' })).toEqual({
      event: 'upsell_purchase',
      value: 19.95,
      currency: 'EUR',
    });
  });

  it('reports the sum of every upsell that was bought, not a single row’s price', () => {
    expect(decide({ record: '["data_leaks","sex_offenders","unlimited_pdf_downloads"]' })?.value).toBe(59.85);
  });

  it('takes its currency from the subscription row rather than from the priced upsell rows', () => {
    expect(decide({ record: '["data_leaks"]', catalogue: [row({ currency: 'USD' })] })?.currency).toBe('EUR');
  });

  it('sends nothing where the catalogue prices the bought upsell at nothing', () => {
    expect(decide({ record: '["data_leaks"]', catalogue: [row({ slug: 'something-else' })] })).toBeNull();
  });

  it('sends nothing where the catalogue could not be read at all', () => {
    expect(decide({ record: '["data_leaks"]', catalogue: undefined })).toBeNull();
  });
});

/*
 * Everything a browser can hold. The decision takes the raw cookie value rather
 * than a parsed one, so the parse guard is covered at this seam: none of these
 * may reach the screen as a valid record, and none may throw.
 */
describe('a record nothing in this application wrote', () => {
  it('reads nothing from a truncated value', () => {
    expect(() => decide({ record: '["data_lea' })).not.toThrow();
    expect(decide({ record: '["data_lea' })).toBeNull();
  });

  it('reads nothing from valid JSON that is not a list', () => {
    expect(decide({ record: '{"upsells":["data_leaks"]}' })).toBeNull();
    expect(decide({ record: '"data_leaks"' })).toBeNull();
    expect(decide({ record: 'null' })).toBeNull();
  });

  it('reads nothing from a list carrying a key the upsell vocabulary does not contain', () => {
    expect(decide({ record: '["data_leaks","free_ponies"]' })).toBeNull();
  });
});

describe('a subscription the payments service could not be asked for', () => {
  it('sends no subscription event, because there is no amount to report', () => {
    expect(decide({ reports: 'subscription', subscriptionPrice: undefined })).toBeNull();
  });

  it('sends no upsell event either, because the currency comes from that record', () => {
    expect(decide({ record: '["data_leaks"]', subscriptionPrice: undefined })).toBeNull();
  });
});
