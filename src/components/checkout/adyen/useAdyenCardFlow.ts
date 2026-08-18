// Source: adapted from https://github.com/QR-CODE-App/payments-client-kickstart/ with modifications
import { type CheckoutAdvancedFlowResponse, type PaymentAction, type UIElement } from '@adyen/adyen-web';
import { type Dispatch, type MutableRefObject, type SetStateAction, useCallback, useEffect, useRef } from 'react';

import { actionCreateAdyenSubscription } from '@/components/checkout/_shared/stubs/adyen.actions';
import { getTrackingData } from '@/components/checkout/_shared/stubs/tracking.client';

import {
  type AdyenCardComponentErrorHandler,
  type AdyenCardComponentPaymentFailedHandler,
  type AdyenCardComponentSubmitHandler,
} from './AdyenCardComponent';
import { useAdyenCheckout } from './AdyenCheckoutContext';
import {
  clearAdyenRedirectSource,
  getCleanReturnUrl,
  isRedirectAction,
  isThreeDs2Action,
  setAdyenRedirectSource,
} from './adyenRedirect.helpers';
import { FailedCardPaymentError, InvalidCreditCardDetailsError } from './paymentErrors';
import { useAdyenRedirectCompletion } from './useAdyenRedirectCompletion';

type Adyen3dsFlowType = 'redirect' | 'modal' | null;

export type AdyenCardComponentErrors = {
  numberError: string;
  expiryError: string;
  cvcError: string;
};

type UseAdyenCardFlowParams = {
  priceId: string;
  defaultErrorMessage: string;
  onCardComponentLoadingChange: (isLoading: boolean) => void;
  onSuccessfulPayment: (transactionId?: string) => void;
  setIsProcessing: (value: boolean) => void;
  setNumberError: Dispatch<SetStateAction<string>>;
  setExpiryError: Dispatch<SetStateAction<string>>;
  setCvcError: Dispatch<SetStateAction<string>>;
  setServerError: Dispatch<SetStateAction<string>>;
};

type UseAdyenCardFlowReturn = {
  isResolvingRedirectResult: boolean;
  submitPayment: () => Promise<string | undefined>;
  handleCardComponentSubmit: AdyenCardComponentSubmitHandler;
  handleCardComponentPaymentCompleted: () => void;
  handleCardComponentPaymentFailed: AdyenCardComponentPaymentFailedHandler;
  handleCardComponentError: AdyenCardComponentErrorHandler;
  handleCardComponentErrorsChange: (errors: AdyenCardComponentErrors) => void;
};

const useRejectPendingPaymentOnUnmount = ({
  threeDsFlowTypeRef,
  rejectPendingPayment,
  clearThreeDsAction,
}: {
  threeDsFlowTypeRef: MutableRefObject<Adyen3dsFlowType>;
  rejectPendingPayment: (error: unknown) => void;
  clearThreeDsAction: () => void;
}) => {
  useEffect(() => {
    return () => {
      if (threeDsFlowTypeRef.current === 'modal') {
        clearThreeDsAction();
      }
      if (threeDsFlowTypeRef.current !== 'redirect') {
        rejectPendingPayment(new FailedCardPaymentError('Adyen card payment was interrupted'));
      }
      threeDsFlowTypeRef.current = null;
    };
  }, [clearThreeDsAction, threeDsFlowTypeRef, rejectPendingPayment]);
};

type AdyenFieldError = { errorI18n?: string } | undefined;
type AdyenCardErrors = {
  encryptedCardNumber?: AdyenFieldError;
  encryptedExpiryDate?: AdyenFieldError;
  encryptedSecurityCode?: AdyenFieldError;
};

const getFieldErrors = (component: UIElement): AdyenCardComponentErrors => {
  const errors = (component.state as unknown as { errors?: AdyenCardErrors }).errors;
  return {
    numberError: errors?.encryptedCardNumber?.errorI18n || '',
    expiryError: errors?.encryptedExpiryDate?.errorI18n || '',
    cvcError: errors?.encryptedSecurityCode?.errorI18n || '',
  };
};

export const useAdyenCardFlow = ({
  priceId,
  defaultErrorMessage,
  onCardComponentLoadingChange,
  onSuccessfulPayment,
  setIsProcessing,
  setNumberError,
  setExpiryError,
  setCvcError,
  setServerError,
}: UseAdyenCardFlowParams): UseAdyenCardFlowReturn => {
  const { showThreeDsAction, clearThreeDsAction, cardComponentRef } = useAdyenCheckout();

  const paymentPromiseRef = useRef<{
    resolve: (transactionId?: string) => void;
    reject: (error: unknown) => void;
  } | null>(null);
  const threeDsFlowTypeRef = useRef<Adyen3dsFlowType>(null);

  const resolvePendingPayment = useCallback((transactionId?: string) => {
    const pendingPayment = paymentPromiseRef.current;
    if (!pendingPayment) {
      return;
    }
    paymentPromiseRef.current = null;
    pendingPayment.resolve(transactionId);
  }, []);

  const rejectPendingPayment = useCallback((error: unknown) => {
    const pendingPayment = paymentPromiseRef.current;
    if (!pendingPayment) {
      return;
    }
    paymentPromiseRef.current = null;
    pendingPayment.reject(error);
  }, []);

  useRejectPendingPaymentOnUnmount({
    threeDsFlowTypeRef,
    rejectPendingPayment,
    clearThreeDsAction,
  });

  const { isResolvingRedirectResult } = useAdyenRedirectCompletion({
    source: 'card',
    failureMessage: defaultErrorMessage,
    logPrefix: 'AdyenCardPayment',
    onStart: () => {
      setServerError('');
    },
    onCompleted: onSuccessfulPayment,
    onFailed: () => {
      setServerError(defaultErrorMessage);
    },
  });

  const handle3dsActionCompleted = useCallback(
    (transactionId?: string) => {
      threeDsFlowTypeRef.current = null;
      resolvePendingPayment(transactionId);
    },
    [resolvePendingPayment],
  );

  const handle3dsActionFailed = useCallback(
    (error: unknown) => {
      threeDsFlowTypeRef.current = null;
      rejectPendingPayment(error);
    },
    [rejectPendingPayment],
  );

  const handleRequireShopperAction = useCallback(
    (action: PaymentAction) => {
      setServerError('');
      showThreeDsAction(action, {
        onCompleted: handle3dsActionCompleted,
        onFailed: handle3dsActionFailed,
      });
      setIsProcessing(false);
    },
    [handle3dsActionCompleted, handle3dsActionFailed, setIsProcessing, setServerError, showThreeDsAction],
  );

  const setCardComponentReady = useCallback(
    (component?: UIElement) => {
      component?.setStatus('ready');
      cardComponentRef.current?.setStatus('ready');
      onCardComponentLoadingChange(false);
    },
    [cardComponentRef, onCardComponentLoadingChange],
  );

  const submitPayment = useCallback(() => {
    const cardComponent = cardComponentRef.current;
    if (!cardComponent) {
      return Promise.reject(new FailedCardPaymentError('Adyen card payment is not initialized'));
    }

    if (paymentPromiseRef.current) {
      return Promise.reject(new FailedCardPaymentError('Adyen card payment is already in progress'));
    }

    setServerError('');
    clearThreeDsAction();
    clearAdyenRedirectSource();
    threeDsFlowTypeRef.current = null;

    return new Promise<string | undefined>((resolve, reject) => {
      paymentPromiseRef.current = { resolve, reject };

      try {
        cardComponent.submit();
        const { isValid } = cardComponent;
        if (!isValid) {
          const { numberError, expiryError, cvcError } = getFieldErrors(cardComponent);
          setNumberError(numberError);
          setExpiryError(expiryError);
          setCvcError(cvcError);
          rejectPendingPayment(new InvalidCreditCardDetailsError());
        }
      } catch (error) {
        rejectPendingPayment(error);
      }
    });
  }, [
    cardComponentRef,
    clearThreeDsAction,
    rejectPendingPayment,
    setCvcError,
    setExpiryError,
    setNumberError,
    setServerError,
  ]);

  const handleCardComponentSubmit: AdyenCardComponentSubmitHandler = useCallback(
    async (state, component, actions) => {
      try {
        const stateData = state.data as Record<string, unknown>;
        const actionResult = await actionCreateAdyenSubscription({
          priceId,
          paymentData: {
            origin: window.origin,
            returnUrl: getCleanReturnUrl(),
            riskData: stateData.riskData as Record<string, unknown> | null,
            paymentMethod: stateData.paymentMethod as Record<string, unknown>,
            browserInfo: stateData.browserInfo as Record<string, unknown> | null,
          },
          trackingMetadata: getTrackingData(),
        });

        const result = actionResult?.data;
        if (!result) {
          threeDsFlowTypeRef.current = null;
          setCardComponentReady(component);
          rejectPendingPayment(new FailedCardPaymentError(defaultErrorMessage));
          actions.reject();
          return;
        }

        const action = result.paymentResult.action;

        if (action && isThreeDs2Action(action)) {
          threeDsFlowTypeRef.current = 'modal';
          handleRequireShopperAction(action as PaymentAction);
          setCardComponentReady(component);
          actions.reject();
          return;
        }

        if (action && isRedirectAction(action)) {
          threeDsFlowTypeRef.current = 'redirect';
          setAdyenRedirectSource('card');
          actions.resolve(result.paymentResult as unknown as CheckoutAdvancedFlowResponse);
          return;
        }

        if (!action && result.result === 'completed') {
          threeDsFlowTypeRef.current = null;
          resolvePendingPayment(result.transactionId);
          actions.resolve(result.paymentResult as unknown as CheckoutAdvancedFlowResponse);
          return;
        }

        if (!action) {
          threeDsFlowTypeRef.current = null;
          setCardComponentReady(component);
          rejectPendingPayment(new FailedCardPaymentError(defaultErrorMessage));
          actions.reject();
          return;
        }

        actions.resolve(result.paymentResult as unknown as CheckoutAdvancedFlowResponse);
      } catch (error) {
        threeDsFlowTypeRef.current = null;
        setCardComponentReady(component);
        rejectPendingPayment(error);
        actions.reject();
      }
    },
    [handleRequireShopperAction, priceId, rejectPendingPayment, resolvePendingPayment, setCardComponentReady],
  );

  const handleCardComponentPaymentCompleted = useCallback(() => {
    threeDsFlowTypeRef.current = null;
    rejectPendingPayment(new FailedCardPaymentError(defaultErrorMessage));
  }, [rejectPendingPayment]);

  const handleCardComponentPaymentFailed: AdyenCardComponentPaymentFailedHandler = useCallback(
    (_data, component) => {
      if (threeDsFlowTypeRef.current === 'modal') {
        setCardComponentReady(component);
        return;
      }
      threeDsFlowTypeRef.current = null;
      setCardComponentReady(component);
      rejectPendingPayment(new FailedCardPaymentError(defaultErrorMessage));
    },
    [rejectPendingPayment, setCardComponentReady],
  );

  const handleCardComponentError: AdyenCardComponentErrorHandler = useCallback(
    (error, component) => {
      if (threeDsFlowTypeRef.current === 'modal') {
        setCardComponentReady(component);
        return;
      }
      threeDsFlowTypeRef.current = null;
      setCardComponentReady(component);
      rejectPendingPayment(error);
    },
    [rejectPendingPayment, setCardComponentReady],
  );

  const handleCardComponentErrorsChange = useCallback(
    ({ numberError, expiryError, cvcError }: AdyenCardComponentErrors) => {
      setNumberError(numberError);
      setExpiryError(expiryError);
      setCvcError(cvcError);
    },
    [setCvcError, setExpiryError, setNumberError],
  );

  return {
    isResolvingRedirectResult,
    submitPayment,
    handleCardComponentSubmit,
    handleCardComponentPaymentCompleted,
    handleCardComponentPaymentFailed,
    handleCardComponentError,
    handleCardComponentErrorsChange,
  };
};
