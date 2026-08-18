import { describe, expect, it } from 'vitest';

import { createPriceFormatter } from './cldr-price-formatter';

const formatPrice = createPriceFormatter();

/*
 * The two special cases are the reason this file exists: they match on the
 * currency code, and the code now arrives in either case — lower from the legacy
 * aggregate the remaining screens read, upper from the payments catalogue the
 * pricing page reads.
 */
describe('createPriceFormatter', () => {
  it.each(['ron', 'RON'])('renders a Romanian price as lei, whichever case %s arrives in', (currency) => {
    expect(formatPrice(2995, currency, 'RO', 'ro')).toBe('29,95 lei');
  });

  it.each(['sgd', 'SGD'])('renders a Singapore price with the S$ symbol, whichever case %s arrives in', (currency) => {
    expect(formatPrice(2995, currency, 'SG', 'en')).toBe('S$29.95');
  });

  it.each(['usd', 'USD'])('leaves every other currency to the CLDR data, in either case (%s)', (currency) => {
    expect(formatPrice(2995, currency, 'US', 'en')).toBe('$29.95');
  });

  it('divides minor units by a hundred, except for a zero-decimal currency', () => {
    expect(formatPrice(2995, 'JPY', 'JP', 'ja')).toBe('￥2,995');
  });
});
