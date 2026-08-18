'use client';

// Source: adapted from https://github.com/QR-CODE-App/payments-client-kickstart/ with modifications
import { useTranslations } from 'next-intl';
import { type FormEvent, useCallback, useRef, useState } from 'react';

import { actionUpdateZipCode } from '@/components/checkout/_shared/stubs/me.actions';
import { useSettings } from '@/components/checkout/_shared/stubs/settings';
import { type ProductWithPrice } from '@/components/checkout/_shared/types/pricing.types';

import { CardForm } from '../CardForm';
import { useCheckoutLoading } from '../CheckoutLoadingProvider';
import { AdyenCardComponent } from './AdyenCardComponent';
import { useAdyenCheckout } from './AdyenCheckoutContext';
import { FailedCardPaymentError, InvalidCreditCardDetailsError } from './paymentErrors';
import { useAdyenCardFlow } from './useAdyenCardFlow';

type AdyenCardPaymentProps = {
  product: ProductWithPrice;
  onPaymentSuccess: (transactionId?: string) => void;
};

export const AdyenCardPayment = ({ product, onPaymentSuccess }: AdyenCardPaymentProps) => {
  const { isLoading: isCheckoutLoading, setIsLoading: setIsCheckoutLoading } = useCheckoutLoading();
  const { isReady, isThreeDsActionVisible } = useAdyenCheckout();
  const { checkoutZipCodeEnabled } = useSettings();
  const t = useTranslations('__NEW__.checkout.CheckoutPage');

  const [numberError, setNumberError] = useState('');
  const [expiryError, setExpiryError] = useState('');
  const [cvcError, setCvcError] = useState('');
  const [serverError, setServerError] = useState('');
  const [isCardFieldLoading, setIsCardFieldLoading] = useState(true);
  const [zipCode, setZipCode] = useState('');

  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const {
    isResolvingRedirectResult,
    submitPayment,
    handleCardComponentSubmit,
    handleCardComponentPaymentCompleted,
    handleCardComponentPaymentFailed,
    handleCardComponentError,
    handleCardComponentErrorsChange,
  } = useAdyenCardFlow({
    priceId: product.price.id,
    defaultErrorMessage: t('paymentGenericError'),
    onCardComponentLoadingChange: setIsCardFieldLoading,
    onSuccessfulPayment: onPaymentSuccess,
    setIsProcessing: setIsCheckoutLoading,
    setNumberError,
    setExpiryError,
    setCvcError,
    setServerError,
  });

  const isLoading = !isReady || isCardFieldLoading;
  const isSubmitDisabled =
    isResolvingRedirectResult || isThreeDsActionVisible || !!numberError || !!expiryError || !!cvcError;

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setServerError('');
      setIsCheckoutLoading(true);

      try {
        if (checkoutZipCodeEnabled) {
          await actionUpdateZipCode({ zipCode });
        }
        const transactionId = await submitPayment();
        onPaymentSuccess(transactionId);
      } catch (error) {
        if (error instanceof InvalidCreditCardDetailsError) {
          // Do not set error message here, it will be shown in the card component
          return;
        }
        if (error instanceof FailedCardPaymentError) {
          setServerError(t('paymentGenericError'));
          return;
        }
        const message = error instanceof Error ? error.message : undefined;
        if (message) {
          setServerError(message);
        }
      } finally {
        setIsCheckoutLoading(false);
      }
    },
    [t, checkoutZipCodeEnabled, setIsCheckoutLoading, submitPayment, zipCode, onPaymentSuccess],
  );

  return (
    <CardForm
      isFieldsLoading={isLoading}
      submitButtonRef={submitButtonRef}
      isSubmitLoading={isCheckoutLoading}
      isSubmitDisabled={isSubmitDisabled}
      onSubmit={handleSubmit}
      fieldErrors={{ numberError, expiryError, cvcError }}
      serverError={serverError || undefined}
      zipCode={zipCode}
      onZipCodeChange={setZipCode}
    >
      <AdyenCardComponent
        submitButtonRef={submitButtonRef}
        isLoading={isLoading}
        onLoadingChange={setIsCardFieldLoading}
        onSubmit={handleCardComponentSubmit}
        onPaymentCompleted={handleCardComponentPaymentCompleted}
        onPaymentFailed={handleCardComponentPaymentFailed}
        onError={handleCardComponentError}
        onFieldErrorsChange={handleCardComponentErrorsChange}
      />
    </CardForm>
  );
};
