'use client';

// Source: adapted from https://github.com/QR-CODE-App/payments-client-kickstart/ with modifications
import { type AdyenCheckoutError, Card, type PaymentFailedData, type UIElement } from '@adyen/adyen-web';
import { type RefObject, useEffect, useRef } from 'react';

import { useCallbackRef } from '@/components/checkout/_shared/hooks/useCallbackRef';
import { cn } from '@/components/checkout/_shared/utils/style.utils';

import styles from './adyen.module.css';
import { CARD_CONFIG_WITHOUT_CALLBACKS } from './adyenCardConfig';
import { useAdyenCheckout } from './AdyenCheckoutContext';
import { type AdyenCardComponentErrors } from './useAdyenCardFlow';

export type AdyenCardComponentSubmitState = {
  data: object;
};

export type AdyenCardComponentSubmitActions = {
  resolve: (data?: unknown) => void;
  reject: () => void;
};

export type AdyenCardComponentSubmitHandler = (
  state: AdyenCardComponentSubmitState,
  component: UIElement,
  actions: AdyenCardComponentSubmitActions,
) => Promise<void>;

export type AdyenCardComponentPaymentFailedHandler = (data?: PaymentFailedData, component?: UIElement) => void;
export type AdyenCardComponentErrorHandler = (error: AdyenCheckoutError, component?: UIElement) => void;

type AdyenCardComponentProps = {
  className?: string;
  isLoading?: boolean;
  submitButtonRef: RefObject<HTMLButtonElement | null>;
  onLoadingChange?: (isLoading: boolean) => void;
  onSubmit?: AdyenCardComponentSubmitHandler;
  onPaymentCompleted?: () => void;
  onPaymentFailed?: AdyenCardComponentPaymentFailedHandler;
  onError?: AdyenCardComponentErrorHandler;
  onFieldErrorsChange?: (errors: AdyenCardComponentErrors) => void;
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

export const AdyenCardComponent = ({
  className,
  isLoading,
  submitButtonRef,
  onLoadingChange,
  onSubmit,
  onPaymentCompleted,
  onPaymentFailed,
  onError,
  onFieldErrorsChange,
}: AdyenCardComponentProps) => {
  const { checkout, cardComponentRef, isReady } = useAdyenCheckout();

  const containerRef = useRef<HTMLDivElement>(null);

  const onLoadingChangeRef = useCallbackRef(onLoadingChange);
  const onSubmitRef = useCallbackRef(onSubmit);
  const onPaymentCompletedRef = useCallbackRef(onPaymentCompleted);
  const onPaymentFailedRef = useCallbackRef(onPaymentFailed);
  const onErrorRef = useCallbackRef(onError);
  const onFieldErrorsChangeRef = useCallbackRef(onFieldErrorsChange);

  const safeUnmount = (component: Card | null) => {
    if (!component) {
      return;
    }

    try {
      component.unmount();
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      const isEarlySecuredFieldsUnmountError =
        message.includes('cannot destroy secured fields') || message.includes('not yet configured');

      if (!isEarlySecuredFieldsUnmountError) {
        console.error('[AdyenCardComponent] Failed to unmount card component', error);
      }
    }
  };

  useEffect(() => {
    const shouldNotMountComponent = !isReady || !checkout || !containerRef.current;

    if (shouldNotMountComponent) {
      onLoadingChangeRef.current?.(true);
      return;
    }

    onLoadingChangeRef.current?.(true);
    safeUnmount(cardComponentRef.current);

    const component = new Card(checkout, {
      ...CARD_CONFIG_WITHOUT_CALLBACKS,
      onEnterKeyPressed: (activeElement) => {
        if (activeElement instanceof HTMLElement) {
          activeElement.blur();
        }
        const submitButton = submitButtonRef.current;
        if (!submitButton || submitButton.disabled) {
          return;
        }
        const form = submitButton.form;
        if (!(form instanceof HTMLFormElement)) {
          return;
        }
        form.requestSubmit(submitButton);
      },
      onSubmit: async (state, component, actions) => {
        if (!onSubmitRef.current) {
          actions.reject();
          return;
        }

        await onSubmitRef.current(
          state as AdyenCardComponentSubmitState,
          component,
          actions as unknown as AdyenCardComponentSubmitActions,
        );
      },
      onPaymentCompleted: () => {
        onPaymentCompletedRef.current?.();
      },
      onPaymentFailed: (data, component) => {
        onPaymentFailedRef.current?.(data, component);
      },
      onError: (error, component) => {
        onErrorRef.current?.(error, component);
      },
      onChange: (_state, component) => {
        onFieldErrorsChangeRef.current?.(getFieldErrors(component));
      },
      onConfigSuccess: () => {
        onLoadingChangeRef.current?.(false);
      },
    });

    if (containerRef.current) {
      component.mount(containerRef.current);
    }
    cardComponentRef.current = component;

    return () => {
      safeUnmount(cardComponentRef.current);
      cardComponentRef.current = null;
    };
  }, [
    cardComponentRef,
    checkout,
    isReady,
    onErrorRef,
    onFieldErrorsChangeRef,
    onLoadingChangeRef,
    onPaymentCompletedRef,
    onPaymentFailedRef,
    onSubmitRef,
    submitButtonRef,
  ]);

  return (
    <div
      ref={containerRef}
      className={cn('h-full w-full', className, styles.adyenCardComponent, isLoading && `invisible`)}
    />
  );
};
