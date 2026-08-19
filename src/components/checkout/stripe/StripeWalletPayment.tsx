import { useElements, useStripe } from '@stripe/react-stripe-js';
import { useTranslations } from 'next-intl';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';

import { getTrackingData } from '@/components/checkout/_shared/stubs/tracking.client';
import { actionStartStripeSubscription } from '@/server/actions/stripe.actions';
import { isHttpClientActionError } from '@/server/lib/safe-action';

import { useCheckoutLoading } from '../CheckoutLoadingProvider';
import { StripeWalletPaymentForm } from './StripeWalletPaymentForm';

type StripeWalletPaymentProps = {
  provider: 'googlePay' | 'applePay';
  priceId: string;
  onPaymentSuccess: (transactionId?: string) => void;
};

export const StripeWalletPayment = ({ provider, priceId, onPaymentSuccess }: StripeWalletPaymentProps) => {
  const t = useTranslations('__NEW__.checkout.CheckoutPage');
  const stripe = useStripe();
  const elements = useElements();

  const [errorMessage, setErrorMessage] = useState<string>();
  const { setIsLoading: setIsCheckoutLoading } = useCheckoutLoading();
  const startSubscriptionAction = useAction(actionStartStripeSubscription);

  const onConfirm = async () => {
    if (!stripe || !elements) {
      return;
    }
    setErrorMessage(undefined);
    setIsCheckoutLoading(true);

    const { error: submitError } = await elements.submit();

    if (submitError) {
      setErrorMessage(submitError.message);
      setIsCheckoutLoading(false);
      return;
    }

    const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
      elements,
    });

    if (paymentMethodError) {
      if (paymentMethodError.type !== 'validation_error') {
        setErrorMessage(paymentMethodError.message);
      }
      setIsCheckoutLoading(false);
      return;
    }

    const actionResult = await startSubscriptionAction.executeAsync({
      priceId,
      paymentMethodId: paymentMethod.id,
      trackingMetadata: getTrackingData(),
    });

    if (actionResult?.data?.clientSecret) {
      // Why confirmCardPayment instead of confirmPayment (aligned with payments-client-kickstart):
      // - Card, Apple Pay, Google Pay don't require redirect (Stripe docs: payment-method-support)
      // - confirmCardPayment handles 3DS in-place and always resolves the promise
      // - onPaymentSuccess must fire after resolve — GTM purchase event is sent there
      // - confirmPayment + return_url redirects the browser before resolving, skipping the callback
      // - Alternative: confirmPayment + redirect: 'if_required', but unnecessary for our payment methods
      const { error } = await stripe.confirmCardPayment(actionResult.data.clientSecret);

      const paymentSucceeded = !error || error.payment_intent?.status === 'succeeded';

      if (paymentSucceeded) {
        // The payment intent identifies the order; the client secret is a credential.
        onPaymentSuccess(actionResult.data.paymentIntentId);
        return;
      }

      setErrorMessage(error.message);
    }

    if (isHttpClientActionError(actionResult?.serverError)) {
      // Keep the error log for debugging purposes
      console.error(actionResult.serverError);
      setErrorMessage(t('paymentGenericError'));
    }

    setIsCheckoutLoading(false);
  };

  return <StripeWalletPaymentForm onConfirm={onConfirm} provider={provider} error={errorMessage} />;
};
