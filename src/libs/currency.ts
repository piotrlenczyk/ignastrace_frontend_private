import { getCountryData, type TCountryCode } from 'countries-list';

import { CURRENCIES, type Currency, DEFAULT_CURRENCY } from '@/constants/currencies';

export function getCurrencyFromCountry(countryCode: string) {
  const country = getCountryData(countryCode as TCountryCode);

  if (!country || !country.currency?.[0]) {
    return DEFAULT_CURRENCY;
  }

  for (const currency of country.currency) {
    const currencyCode = currency.toLowerCase();

    // Special handling for Bulgaria (BGN) -> EUR
    if (currencyCode === 'bgn') {
      return 'eur';
    }

    if (CURRENCIES.includes(currencyCode as Currency)) {
      return currencyCode as string;
    }
  }

  return DEFAULT_CURRENCY;
}
