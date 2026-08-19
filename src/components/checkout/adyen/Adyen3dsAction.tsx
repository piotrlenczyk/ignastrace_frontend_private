'use client';

// Source: adapted from https://github.com/QR-CODE-App/payments-client-kickstart/ with modifications
import {
  type AdditionalDetailsActions,
  type AdditionalDetailsData,
  type AdyenCheckoutError,
  type CheckoutAdvancedFlowResponse,
  type PaymentAction,
  type UIElement,
} from '@adyen/adyen-web';
import { useEffect, useRef } from 'react';

import { useCallbackRef } from '@/hooks/use-callback-ref';
import { actionSubmitAdyenCompletionDetails } from '@/server/actions/adyen.actions';

import { useAdyenCheckout } from './AdyenCheckoutContext';
import { FailedCardPaymentError } from './paymentErrors';

type AdyenThreeDSActionProps = {
  action: PaymentAction;
  defaultErrorMessage: string;
  setAction: (action: PaymentAction | null) => void;
  onCompleted: (transactionId?: string) => void;
  onFailed: (error: unknown) => void;
};

export const Adyen3dsAction = ({
  action,
  defaultErrorMessage,
  setAction,
  onCompleted,
  onFailed,
}: AdyenThreeDSActionProps) => {
  const { checkout, isReady } = useAdyenCheckout();
  const containerRef = useRef<HTMLDivElement>(null);
  const actionComponentRef = useRef<UIElement | null>(null);
  const completionTransactionIdRef = useRef<string | undefined>(undefined);

  const onCompletedRef = useCallbackRef(onCompleted);
  const onFailedRef = useCallbackRef(onFailed);

  useEffect(() => {
    const shouldNotMountComponent = !isReady || !checkout || !containerRef.current;

    if (shouldNotMountComponent) {
      return;
    }

    actionComponentRef.current?.unmount();
    actionComponentRef.current = null;
    completionTransactionIdRef.current = undefined;

    const component = checkout.createFromAction(action, {
      challengeWindowSize: '05',
      onAdditionalDetails: async (
        state: AdditionalDetailsData,
        _component: UIElement,
        actions: AdditionalDetailsActions,
      ) => {
        try {
          const actionResult = await actionSubmitAdyenCompletionDetails({
            actionData: state.data as Record<string, unknown>,
          });
          const result = actionResult?.data;
          if (!result) {
            actions.reject();
            onFailedRef.current(new FailedCardPaymentError(defaultErrorMessage));
            return;
          }

          completionTransactionIdRef.current = result.transactionId;
          // @ts-expect-error - TODO: [refactor] add type for paymentResult
          const isCompletedWithoutNextAction = !result.paymentResult.action && result.result === 'completed';
          // @ts-expect-error - TODO: [refactor] add type for paymentResult
          const isFailedWithoutNextAction = !result.paymentResult.action && result.result !== 'completed';

          if (isCompletedWithoutNextAction) {
            actions.resolve(result.paymentResult as unknown as CheckoutAdvancedFlowResponse);
            onCompletedRef.current(result.transactionId);
            return;
          }
          if (isFailedWithoutNextAction) {
            actions.reject();
            onFailedRef.current(new FailedCardPaymentError(defaultErrorMessage));
            return;
          }
          actions.resolve(result.paymentResult as unknown as CheckoutAdvancedFlowResponse);
        } catch (error) {
          actions.reject();
          onFailedRef.current(error);
        }
      },
      onPaymentCompleted: () => {
        const transactionId = completionTransactionIdRef.current;
        if (!transactionId) {
          onFailedRef.current(new FailedCardPaymentError(defaultErrorMessage));
          return;
        }
        onCompletedRef.current(transactionId);
      },
      onPaymentFailed: () => {
        onFailedRef.current(new FailedCardPaymentError(defaultErrorMessage));
      },
      onError: (error: AdyenCheckoutError) => {
        onFailedRef.current(error);
      },
    });

    if (containerRef.current) {
      component.mount(containerRef.current);
    }
    actionComponentRef.current = component;

    return () => {
      component.unmount();
      if (actionComponentRef.current === component) {
        actionComponentRef.current = null;
      }
    };
  }, [action, checkout, isReady, onCompletedRef, onFailedRef]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          actionComponentRef.current?.unmount();
          onFailed(new FailedCardPaymentError(defaultErrorMessage));
          setAction(null);
        }}
        className={`absolute -top-4 right-0 -translate-y-full text-sm leading-none font-medium text-white/75 uppercase`}
      >
        cancel
      </button>
      <div ref={containerRef} className={'size-full'} />
    </>
  );
};
