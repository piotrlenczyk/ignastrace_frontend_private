import { type ApplePayConfiguration, type GooglePayConfiguration, type RawPaymentMethod } from '@adyen/adyen-web';

export type WalletComponentConfiguration = {
  applePay: ApplePayBackendConfiguration | undefined;
  googlePay: GooglePayBackendConfiguration | undefined;
};

export type ApplePayBackendConfiguration = NonNullable<ApplePayConfiguration['configuration']>;

export type GooglePayBackendConfiguration = NonNullable<GooglePayConfiguration['configuration']>;

type ApplePayPaymentMethod = RawPaymentMethod & {
  type: 'applepay';
  configuration?: ApplePayBackendConfiguration;
};

type GooglePayPaymentMethod = RawPaymentMethod & {
  type: 'googlepay';
  configuration?: GooglePayBackendConfiguration;
};

const WALLET_BUSINESS_NAME = 'ResumeWise';

export const getWalletComponentConfiguration = (paymentMethods: RawPaymentMethod[]): WalletComponentConfiguration => {
  const applePayMethod = paymentMethods.find(
    (paymentMethod): paymentMethod is ApplePayPaymentMethod => paymentMethod.type === 'applepay',
  );
  const googlePayMethod = paymentMethods.find(
    (paymentMethod): paymentMethod is GooglePayPaymentMethod => paymentMethod.type === 'googlepay',
  );

  return {
    applePay: applePayMethod?.configuration
      ? { ...applePayMethod.configuration, merchantName: WALLET_BUSINESS_NAME }
      : undefined,
    googlePay: googlePayMethod?.configuration
      ? {
          ...googlePayMethod.configuration,
          merchantName: WALLET_BUSINESS_NAME,
        }
      : undefined,
  };
};
