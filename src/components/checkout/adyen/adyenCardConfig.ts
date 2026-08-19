// Source: adapted from https://github.com/QR-CODE-App/payments-client-kickstart/ with modifications
export const CARD_CONFIG_WITHOUT_CALLBACKS = {
  hasHolderName: false,
  enableStoreDetails: false,
  hideCVC: false,
  placeholders: {
    cardNumber: '1234 1234 1234 1234',
    expiryDate: 'MM / YY',
    securityCodeThreeDigits: 'CVC',
    securityCodeFourDigits: 'CVC',
  },
  styles: {
    base: {
      padding: '0 12px',
      fontSize: '16px',
      fontWeight: '400',
      color: 'hsla(0, 5%, 4%, 1)',
    },
    placeholder: {
      fontSize: '16px',
      fontWeight: '400',
      color: 'hsla(230, 100%, 15%, 0.45)',
    },
  },
} as const;
