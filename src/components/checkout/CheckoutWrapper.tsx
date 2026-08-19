'use client';

import { AdyenCheckout } from './adyen/AdyenCheckout';
import { useCheckout } from './CheckoutProvider';
import { StripeCheckout } from './stripe/StripeCheckout';

export const CheckoutWrapper = () => {
  const { provider } = useCheckout();

  if (provider === 'adyen') {
    return <AdyenCheckout />;
  }

  if (provider === 'stripe') {
    return <StripeCheckout />;
  }

  return null;
};
