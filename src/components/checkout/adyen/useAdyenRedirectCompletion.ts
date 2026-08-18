// Source: adapted from https://github.com/QR-CODE-App/payments-client-kickstart/ with modifications
import { useEffect, useRef, useState } from 'react';

import { useCallbackRef } from '@/components/checkout/_shared/hooks/useCallbackRef';
import { actionSubmitAdyenCompletionDetails } from '@/components/checkout/_shared/stubs/adyen.actions';

import {
  type AdyenRedirectSource,
  clearAdyenRedirectSource,
  clearRedirectParamsFromLocation,
  getAdyenRedirectSource,
  getRedirectResultFromLocation,
} from './adyenRedirect.helpers';
import { FailedCardPaymentError } from './paymentErrors';

type UseAdyenRedirectCompletionParams = {
  source: AdyenRedirectSource;
  failureMessage: string;
  logPrefix: string;
  onStart?: () => void;
  onCompleted: (transactionId?: string) => void;
  onFailed: (error: unknown) => void;
};

type UseAdyenRedirectCompletionReturn = {
  isResolvingRedirectResult: boolean;
};

let isRedirectCompletionClaimed = false;

const tryClaimRedirectCompletion = () => {
  if (isRedirectCompletionClaimed) {
    return false;
  }
  isRedirectCompletionClaimed = true;
  return true;
};

export const useAdyenRedirectCompletion = ({
  source,
  failureMessage,
  logPrefix,
  onStart,
  onCompleted,
  onFailed,
}: UseAdyenRedirectCompletionParams): UseAdyenRedirectCompletionReturn => {
  const [isResolvingRedirectResult, setIsResolvingRedirectResult] = useState(false);
  const hasProcessedRedirectResultRef = useRef(false);

  const onStartRef = useCallbackRef(onStart);
  const onCompletedRef = useCallbackRef(onCompleted);
  const onFailedRef = useCallbackRef(onFailed);

  useEffect(() => {
    if (hasProcessedRedirectResultRef.current) {
      return;
    }

    const redirectResult = getRedirectResultFromLocation();
    if (!redirectResult) {
      return;
    }

    const redirectSource = getAdyenRedirectSource();
    if (redirectSource && redirectSource !== source) {
      return;
    }

    if (!tryClaimRedirectCompletion()) {
      return;
    }

    hasProcessedRedirectResultRef.current = true;
    onStartRef.current?.();
    setIsResolvingRedirectResult(true);

    const completeRedirectPayment = async () => {
      try {
        const actionResult = await actionSubmitAdyenCompletionDetails({
          redirectResult,
        });
        clearRedirectParamsFromLocation();

        const result = actionResult?.data;
        if (!result || result.result !== 'completed') {
          throw new FailedCardPaymentError(failureMessage);
        }

        onCompletedRef.current(result.transactionId);
      } catch (error) {
        console.error(`[${logPrefix}] Failed to handle redirect payment completion`, error);
        onFailedRef.current(error);
        clearRedirectParamsFromLocation();
      } finally {
        clearAdyenRedirectSource();
        setIsResolvingRedirectResult(false);
      }
    };

    void completeRedirectPayment();
  }, [failureMessage, logPrefix, onCompletedRef, onFailedRef, onStartRef, source]);

  return { isResolvingRedirectResult };
};
