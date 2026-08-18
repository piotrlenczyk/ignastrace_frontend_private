import { getCountryData, type TCountryCode } from 'countries-list';

import { CURRENCIES, type Currency, DEFAULT_CURRENCY } from '@/constants/currencies';

export function getCurrencyByCountryCode(_countryCode?: string) {
  if (!_countryCode) {
    return DEFAULT_CURRENCY;
  }

  const countryCode = _countryCode?.toUpperCase();

  const country = getCountryData(countryCode as TCountryCode);

  if (!country || !country.currency?.[0]) {
    return DEFAULT_CURRENCY;
  }

  for (const currency of country.currency) {
    const currencyCode = currency.toUpperCase();

    // Special handling for Bulgaria (BGN) -> EUR
    if (currencyCode === 'BGN') {
      return 'EUR';
    }

    /*
     * The currency table is keyed in lower case and this function answers in
     * upper case, the way the payments catalogue publishes a currency. The
     * comparison therefore has to state its own case: matching the answer
     * against the table directly silently matched nothing, and every market
     * fell through to US dollars.
     */
    if (CURRENCIES.includes(currency.toLowerCase() as Currency)) {
      return currencyCode;
    }
  }

  return DEFAULT_CURRENCY;
}
