'use client';

import { Elements } from '@stripe/react-stripe-js';
import { type StripeElementLocale } from '@stripe/stripe-js';
import { useLocale } from 'next-intl';

import { useStripePromiseRef } from '@/hooks/use-stripe-promise-ref';

import { useCheckout } from '../CheckoutProvider';
import { StripeCardPayment } from './StripeCardPayment';
import { StripeWalletPayment } from './StripeWalletPayment';

export const StripeCheckout = () => {
  const { product, paymentMethod, handlePaymentSuccess } = useCheckout();
  const locale = useLocale();
  const stripePublicKey = product.price.providerAccount.clientKey ?? '';
  const stripePromiseRef = useStripePromiseRef(stripePublicKey);
  const { id: priceId } = product.price;

  return (
    <Elements
      stripe={stripePromiseRef.current}
      options={{
        locale: locale as StripeElementLocale,
        amount: product.price.finalAmount,
        currency: product.price.currency.toLowerCase(),
        mode: 'subscription',
        paymentMethodCreation: 'manual',
      }}
    >
      {paymentMethod === 'card' ? (
        <StripeCardPayment priceId={priceId} onPaymentSuccess={handlePaymentSuccess} />
      ) : null}
      {paymentMethod === 'applePay' ? (
        <StripeWalletPayment provider="applePay" priceId={priceId} onPaymentSuccess={handlePaymentSuccess} />
      ) : null}
      {paymentMethod === 'googlePay' ? (
        <StripeWalletPayment provider="googlePay" priceId={priceId} onPaymentSuccess={handlePaymentSuccess} />
      ) : null}
    </Elements>
  );
};
