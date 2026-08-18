import { describe, expect, it } from 'vitest';

import { getCurrencyByCountryCode } from './currency';

/*
 * This function answers in the case the payments catalogue publishes a currency
 * in, while the currency table it checks against is keyed in the other case. The
 * cases below exist because reconciling the two by hand once already collapsed
 * every market onto US dollars.
 */
describe('getCurrencyByCountryCode', () => {
  it("answers with the market's own currency, upper-cased", () => {
    expect(getCurrencyByCountryCode('DE')).toBe('EUR');
    expect(getCurrencyByCountryCode('GB')).toBe('GBP');
  });

  it('resolves a country code given in either case', () => {
    expect(getCurrencyByCountryCode('de')).toBe('EUR');
  });

  it('answers in euros for Bulgaria rather than in leva', () => {
    expect(getCurrencyByCountryCode('BG')).toBe('EUR');
  });

  it('falls back to US dollars for a country this application does not price', () => {
    expect(getCurrencyByCountryCode('KP')).toBe('USD');
  });

  it('falls back to US dollars when no market is known', () => {
    expect(getCurrencyByCountryCode()).toBe('USD');
  });
});
