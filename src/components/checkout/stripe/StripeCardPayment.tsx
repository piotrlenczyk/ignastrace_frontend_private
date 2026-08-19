'use client';

import { CardNumberElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useTranslations } from 'next-intl';
import { useAction } from 'next-safe-action/hooks';
import { type FormEvent, useState } from 'react';

import { getTrackingData } from '@/components/checkout/_shared/stubs/tracking.client';
import { actionStartStripeSubscription, actionSyncStripeSubscriptionStatus } from '@/server/actions/stripe.actions';
import { isHttpClientActionError } from '@/server/lib/safe-action';
import { useSettings } from '@/settings/settings.provider';

import { CardForm } from '../CardForm';
import { type CardFieldErrors } from '../cardForm.types';
import { useCheckoutLoading } from '../CheckoutLoadingProvider';
import { StripeCardComponent } from './StripeCardComponent';

type StripeCheckoutCardFormProps = {
  priceId: string;
  onPaymentSuccess: (transactionId?: string) => void;
};

export const StripeCardPayment = ({ priceId, onPaymentSuccess }: StripeCheckoutCardFormProps) => {
  const t = useTranslations('__NEW__.checkout.Checkout');
  const { checkoutZipCodeEnabled } = useSettings();

  const [isFieldsLoading, setIsFieldsLoading] = useState(true);
  const [zipCode, setZipCode] = useState('');
  const [serverError, setServerError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<CardFieldErrors>({
    numberError: '',
    expiryError: '',
    cvcError: '',
  });
  const { isLoading: isCheckoutLoading, setIsLoading: setIsCheckoutLoading } = useCheckoutLoading();
  const startSubscriptionAction = useAction(actionStartStripeSubscription);

  const stripe = useStripe();
  const elements = useElements();

  const isSubmitDisabled = !!(fieldErrors.numberError || fieldErrors.expiryError || fieldErrors.cvcError);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stripe || !elements) {
      return;
    }
    setServerError(undefined);
    setIsCheckoutLoading(true);

    // TODO: [refactor] add zip code update if required
    const zipCodeResult = checkoutZipCodeEnabled
      ? {
          data: {
            isZipCodeValid: true,
            zipCode: zipCode,
          },
        }
      : undefined;

    const resolvedZipCode = zipCodeResult?.data?.isZipCodeValid ? (zipCodeResult.data.zipCode ?? '') : '';

    const cardNumberElement = elements.getElement(CardNumberElement);

    // Validate the card first using createPaymentMethod
    const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardNumberElement!,
      billing_details: {
        address: {
          postal_code: resolvedZipCode,
        },
      },
    });

    if (paymentMethodError) {
      if (paymentMethodError.type !== 'validation_error') {
        setServerError(paymentMethodError.message);
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
      const { error } = await stripe.confirmCardPayment(actionResult.data.clientSecret);

      const paymentSucceeded = !error;

      if (paymentSucceeded) {
        void actionSyncStripeSubscriptionStatus();
        // The payment intent identifies the order; the client secret is a credential.
        onPaymentSuccess(actionResult.data.paymentIntentId);

        return;
      }

      if (error?.type !== 'validation_error') {
        setServerError(t('paymentGenericError'));
      }
    }

    if (isHttpClientActionError(actionResult?.serverError)) {
      // Keep the error log for debugging purposes
      console.error(actionResult.serverError);
      setServerError(t('paymentGenericError'));
    }

    if (actionResult?.validationErrors) {
      setServerError(JSON.stringify(actionResult.validationErrors));
    }

    setIsCheckoutLoading(false);
  };
  return (
    <CardForm
      isFieldsLoading={isFieldsLoading}
      isSubmitLoading={isCheckoutLoading}
      isSubmitDisabled={isSubmitDisabled}
      onSubmit={handleSubmit}
      fieldErrors={fieldErrors}
      serverError={serverError || undefined}
      zipCode={zipCode}
      onZipCodeChange={setZipCode}
    >
      <StripeCardComponent
        isLoading={isFieldsLoading}
        onLoadingChange={setIsFieldsLoading}
        onFieldErrorsChange={setFieldErrors}
      />
    </CardForm>
  );
};
