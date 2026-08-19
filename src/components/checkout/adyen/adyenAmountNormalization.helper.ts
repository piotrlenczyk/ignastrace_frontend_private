// Source: adapted from https://github.com/QR-CODE-App/payments-client-kickstart/ with modifications
const CURRENCIES_TO_ADD_DECIMALS_IN_ADYEN = ['CLP'];
const CURRENCIES_TO_DROP_DECIMALS_IN_ADYEN = ['CVE', 'IDR'];

// Helper to normalize prices from DB which are using Stripe format which doesn't match with Adyen's for some currencies.
export const getAmountNormalizedForAdyen = (intAmount: number, currency: string) => {
  const shouldAdd2Decimals = CURRENCIES_TO_ADD_DECIMALS_IN_ADYEN.includes(currency.toUpperCase());
  const shouldRemove2Decimals = CURRENCIES_TO_DROP_DECIMALS_IN_ADYEN.includes(currency.toUpperCase());
  if (shouldAdd2Decimals) {
    return intAmount * 100;
  }
  if (shouldRemove2Decimals) {
    return intAmount / 100;
  }
  return intAmount;
};
