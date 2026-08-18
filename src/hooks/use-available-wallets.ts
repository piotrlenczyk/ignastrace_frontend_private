import type { AvailablePaymentMethods, Stripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';

const WALLET_COUNTRY = 'AE';

/**
 * Wallets this hook does not surface. stripe-js v5 widened
 * `AvailablePaymentMethods` with `amazonPay`, `link` and `paypal`; the
 * PaymentRequest flow here only reports Apple Pay and Google Pay, so the rest
 * stay off.
 */
const UNSUPPORTED_WALLETS = {
  amazonPay: false,
  link: false,
  paypal: false,
} as const;

export const useAvailableWallets = (stripe: Stripe | null, currency: string) => {
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<AvailablePaymentMethods>({
    applePay: false,
    googlePay: false,
    ...UNSUPPORTED_WALLETS,
  });

  useEffect(() => {
    const checkPaymentMethods = async () => {
      if (!stripe) {
        return;
      }

      const paymentRequest = stripe.paymentRequest({
        country: WALLET_COUNTRY,
        currency,
        total: {
          label: 'Demo total',
          amount: 1,
        },
      });

      const result = await paymentRequest.canMakePayment();

      setAvailablePaymentMethods({
        applePay: !!result?.applePay,
        googlePay: !!result?.googlePay,
        ...UNSUPPORTED_WALLETS,
      });
    };

    checkPaymentMethods();
  }, [stripe, currency]);

  return availablePaymentMethods;
};
