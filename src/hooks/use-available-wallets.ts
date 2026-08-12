import type { AvailablePaymentMethods, Stripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';

const WALLET_COUNTRY = 'AE';

export const useAvailableWallets = (stripe: Stripe | null, currency: string) => {
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<AvailablePaymentMethods>({
    applePay: false,
    googlePay: false,
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
      });
    };

    checkPaymentMethods();
  }, [stripe, currency]);

  return availablePaymentMethods;
};
