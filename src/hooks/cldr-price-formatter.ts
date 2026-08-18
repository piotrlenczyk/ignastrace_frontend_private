const formatCurrencyOptions = (amount: number, isZeroDecimal: boolean): Intl.NumberFormatOptions => {
  return {
    minimumFractionDigits: isZeroDecimal ? 0 : amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: isZeroDecimal ? 0 : 2,
  };
};

const isZeroDecimalCurrency = (currency: string) => {
  return [
    'BIF',
    'CLP',
    'DJF',
    'GNF',
    'JPY',
    'KMF',
    'KRW',
    'MGA',
    'PYG',
    'RWF',
    'UGX',
    'VND',
    'VUV',
    'XAF',
    'XOF',
    'XPF',
  ].includes(currency.toUpperCase());
};

export const createPriceFormatter = () => {
  return (
    price: number,
    currency: string,
    country: string,
    locale: string,
    currencyDisplay: 'narrowSymbol' | 'symbol' = 'symbol',
  ) => {
    const isZeroDecimal = isZeroDecimalCurrency(currency);
    const amount = isZeroDecimal ? price : price / 100;

    const formatOptions = formatCurrencyOptions(amount, isZeroDecimal);

    /*
     * Case-insensitive on purpose: the legacy aggregate publishes a lower-case
     * code and the payments service an upper-case one, and both reach this
     * formatter while the screens migrate one at a time.
     */
    const currencyCode = currency.toLowerCase();

    if (locale === 'ro' && country === 'RO' && currencyCode === 'ron') {
      const formatPrice = new Intl.NumberFormat(`${locale}-${country}`, formatOptions).format(amount);
      return `${formatPrice} lei`;
    }

    if (currencyCode === 'sgd') {
      const formatPrice = new Intl.NumberFormat(`${locale}-${country}`, formatOptions).format(amount);
      return `S$${formatPrice}`;
    }

    return new Intl.NumberFormat(`${locale}-${country}`, {
      ...formatOptions,
      style: 'currency',
      currency,
      currencyDisplay,
    }).format(amount);
  };
};
