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

    if (CURRENCIES.includes(currencyCode as Currency)) {
      return currencyCode as string;
    }
  }

  return DEFAULT_CURRENCY;
}
