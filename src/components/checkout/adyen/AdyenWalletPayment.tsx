'use client';

// Source: adapted from https://github.com/QR-CODE-App/payments-client-kickstart/ with modifications
import {
  type AdyenCheckoutError,
  ApplePay,
  type ApplePayConfiguration,
  type CheckoutAdvancedFlowResponse,
  type Core,
  type CoreConfiguration,
  GooglePay,
  type GooglePayConfiguration,
  type PaymentAction,
  type SubmitActions,
  type UIElement,
} from '@adyen/adyen-web';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useCallbackRef } from '@/components/checkout/_shared/hooks/useCallbackRef';
import { actionCreateAdyenSubscription } from '@/components/checkout/_shared/stubs/adyen.actions';
import { getTrackingData } from '@/components/checkout/_shared/stubs/tracking.client';
import { type ProductWithPrice } from '@/components/checkout/_shared/types/pricing.types';
import { Spinner } from '@/components/checkout/_shared/ui/Spinner';
import { cn } from '@/components/checkout/_shared/utils/style.utils';
import { useGenericErrorToast as useUnexpectedErrorToast } from '@/hooks/use-generic-error-toast';

import { useCheckoutLoading } from '../CheckoutLoadingProvider';
import { WalletForm } from '../WalletForm';
import { useAdyenCheckout } from './AdyenCheckoutContext';
import {
  clearAdyenRedirectSource,
  getCleanReturnUrl,
  isRedirectAction,
  isThreeDs2Action,
  setAdyenRedirectSource,
} from './adyenRedirect.helpers';
import { getWalletComponentConfiguration, type WalletComponentConfiguration } from './adyenWalletPaymentConfig.helpers';
import { FailedCardPaymentError } from './paymentErrors';
import { useAdyenRedirectCompletion } from './useAdyenRedirectCompletion';

type WalletPaymentMethod = 'applePay' | 'googlePay';

type GooglePayAuthorizedData = Parameters<NonNullable<GooglePayConfiguration['onAuthorized']>>[0];
type ApplePayAuthorizedData = Parameters<NonNullable<ApplePayConfiguration['onAuthorized']>>[0];
type ApplePayAuthorizedEvent = ApplePayAuthorizedData['authorizedEvent'];
type ApplePayContact = ApplePayAuthorizedEvent['payment']['billingContact'];

const getTrimmedValue = (value?: string) => value?.trim() || undefined;

const extractNameFromGooglePay = (data: GooglePayAuthorizedData) => {
  return (
    getTrimmedValue(data.authorizedEvent.paymentMethodData.info?.billingAddress?.name) ??
    getTrimmedValue(data.authorizedEvent.shippingAddress?.name)
  );
};

const extractEmailFromGooglePay = (data: GooglePayAuthorizedData) => {
  return getTrimmedValue(data.authorizedEvent.email);
};

const extractEmailFromApplePay = (data: ApplePayAuthorizedData) => {
  const authorizedEvent = data.authorizedEvent;
  return (
    getTrimmedValue(authorizedEvent.payment.billingContact?.emailAddress) ??
    getTrimmedValue(authorizedEvent.payment.shippingContact?.emailAddress)
  );
};

const extractNameFromApplePayContact = (contact?: ApplePayContact) => {
  const givenName = getTrimmedValue(contact?.givenName);
  const familyName = getTrimmedValue(contact?.familyName);

  if (givenName && familyName) {
    return `${givenName} ${familyName}`;
  }

  return undefined;
};

const extractNameFromApplePay = (data: ApplePayAuthorizedData) => {
  const authorizedEvent = data.authorizedEvent;
  return (
    extractNameFromApplePayContact(authorizedEvent.payment.billingContact) ??
    extractNameFromApplePayContact(authorizedEvent.payment.shippingContact)
  );
};

type WalletBaseConfig = {
  acquiringCountryCode: string | undefined;
  onClick: (resolve: () => void, reject: () => void) => void;
  onGooglePayAuthorized?: NonNullable<GooglePayConfiguration['onAuthorized']>;
  onApplePayAuthorized?: NonNullable<ApplePayConfiguration['onAuthorized']>;
  onSubmit: NonNullable<CoreConfiguration['onSubmit']>;
  onError: (error: AdyenCheckoutError, component?: UIElement) => void;
};

enum WalletAvailability {
  Pending = 'pending',
  Available = 'available',
  Unavailable = 'unavailable',
}

// Adyen Google Pay keeps the payment sheet open on error responses.
// We return this synthetic non-error code only to dismiss the sheet UI;
// actual payment outcome is still handled by our backend result checks.
const closeGooglePaySheet = (actions: SubmitActions) => {
  actions.resolve({ resultCode: 'Received' });
};

const createWalletComponent = (
  method: WalletPaymentMethod,
  checkout: Core,
  config: WalletBaseConfig,
  walletConfiguration: WalletComponentConfiguration,
) => {
  if (method === 'googlePay') {
    return new GooglePay(checkout, {
      countryCode: config.acquiringCountryCode,
      buttonType: 'plain',
      buttonColor: 'black',
      buttonSizeMode: 'fill',
      showPayButton: true,
      configuration: walletConfiguration.googlePay,
      transactionInfo: {
        totalPriceLabel: 'Total',
      },
      buttonRadius: 5,
      emailRequired: true,
      shippingAddressRequired: false,
      billingAddressRequired: true,
      onClick: config.onClick,
      onAuthorized: config.onGooglePayAuthorized,
      onSubmit: config.onSubmit,
      onError: config.onError,
    });
  }

  return new ApplePay(checkout, {
    buttonType: 'plain',
    buttonColor: 'black',
    showPayButton: true,
    configuration: walletConfiguration.applePay,
    requiredShippingContactFields: ['name', 'email'],
    onClick: config.onClick,
    onAuthorized: config.onApplePayAuthorized,
    onSubmit: config.onSubmit,
    onError: config.onError,
  });
};

type AdyenWalletPaymentProps = {
  provider: WalletPaymentMethod;
  product: ProductWithPrice;
  onPaymentSuccess: (transactionId?: string) => void;
};

export const AdyenWalletPayment = ({ provider, product, onPaymentSuccess }: AdyenWalletPaymentProps) => {
  const t = useTranslations('__NEW__.checkout.CheckoutPage');
  const {
    checkout,
    isReady,
    error: checkoutError,
    paymentMethods,
    showThreeDsAction,
    clearThreeDsAction,
    isThreeDsActionVisible,
  } = useAdyenCheckout();

  const defaultErrorMessage = t('paymentGenericError');
  const { isLoading: isCheckoutLoading, setIsLoading: setIsCheckoutLoading } = useCheckoutLoading();
  const showFailedPaymentToast = useUnexpectedErrorToast();

  const [availability, setAvailability] = useState<WalletAvailability>(WalletAvailability.Pending);

  const containerRef = useRef<HTMLDivElement>(null);
  const componentRef = useRef<UIElement | null>(null);
  const is3dsInProgressRef = useRef(false);
  // Adyen can call multiple failure callbacks for one wallet attempt. This guards duplicate toast/onFailed side effects.
  const hasHandledFailureForCurrentAttemptRef = useRef(false);
  const walletNameRef = useRef<string | undefined>(undefined);
  const walletEmailRef = useRef<string | undefined>(undefined);

  const handleFailure = useCallback(
    (error: unknown) => {
      console.error('[AdyenWalletPayment] Payment failed', error);
      showFailedPaymentToast();
    },
    [showFailedPaymentToast],
  );

  const handleSuccess = useCallback(
    (transactionId?: string) => {
      onPaymentSuccess(transactionId);
    },
    [onPaymentSuccess],
  );

  const handleFailureRef = useCallbackRef(handleFailure);
  const handleSuccessRef = useCallbackRef(handleSuccess);

  const { isResolvingRedirectResult } = useAdyenRedirectCompletion({
    source: provider,
    failureMessage: t('paymentGenericError'),
    logPrefix: 'AdyenWalletPayment',
    onCompleted: async (transactionId) => {
      handleSuccess(transactionId);
    },
    onFailed: (error: unknown) => {
      handleFailureRef.current(error);
    },
  });

  const acquiringCountryCode = product.price.providerAccount.countryCode;
  const walletConfiguration = useMemo(() => getWalletComponentConfiguration(paymentMethods), [paymentMethods]);

  useEffect(() => {
    const checkAvailability = (component: ReturnType<typeof createWalletComponent>) => {
      let cancelled = false;

      void component
        .isAvailable()
        .then(() => {
          if (cancelled || !containerRef.current) {
            return;
          }
          component.mount(containerRef.current);
          setAvailability(WalletAvailability.Available);
        })
        .catch(() => {
          if (cancelled) {
            return;
          }
          unmountTrackedWallet(component);
          setAvailability(WalletAvailability.Unavailable);
        });

      return () => {
        cancelled = true;
        unmountTrackedWallet(component);
      };
    };

    const teardownWallet = (nextAvailability: WalletAvailability) => {
      componentRef.current?.unmount();
      componentRef.current = null;
      is3dsInProgressRef.current = false;
      setAvailability(nextAvailability);
    };

    const unmountTrackedWallet = (component: ReturnType<typeof createWalletComponent>) => {
      component.unmount();
      if (componentRef.current === component) {
        componentRef.current = null;
      }
    };

    const getWalletConfig = (): WalletBaseConfig => {
      const cleanupAttempt = () => {
        setIsCheckoutLoading(false);
      };

      const handleFailureOnce = (error: unknown) => {
        if (hasHandledFailureForCurrentAttemptRef.current) {
          return;
        }
        hasHandledFailureForCurrentAttemptRef.current = true;
        handleFailureRef.current(error);
      };

      const handleGooglePayThreeDsAction = (action: PaymentAction) => {
        is3dsInProgressRef.current = true;
        showThreeDsAction(action, {
          onCompleted: (transactionId) => {
            is3dsInProgressRef.current = false;
            handleSuccessRef.current(transactionId);
          },
          onFailed: (error: unknown) => {
            is3dsInProgressRef.current = false;
            handleFailureRef.current(error);
          },
        });
      };

      return {
        acquiringCountryCode,
        onClick: (resolve) => {
          hasHandledFailureForCurrentAttemptRef.current = false;
          walletNameRef.current = undefined;
          walletEmailRef.current = undefined;
          resolve();
        },
        onGooglePayAuthorized:
          provider === 'googlePay'
            ? (data, actions) => {
                walletNameRef.current = extractNameFromGooglePay(data);
                walletEmailRef.current = extractEmailFromGooglePay(data);
                actions.resolve();
              }
            : undefined,
        onApplePayAuthorized:
          provider === 'applePay'
            ? (data, actions) => {
                walletNameRef.current = extractNameFromApplePay(data);
                walletEmailRef.current = extractEmailFromApplePay(data);
                actions.resolve();
              }
            : undefined,
        onSubmit: async (state, _component, actions) => {
          setIsCheckoutLoading(true);
          is3dsInProgressRef.current = false;
          clearThreeDsAction();
          clearAdyenRedirectSource();
          try {
            const stateData = state.data as unknown as Record<string, unknown>;
            const actionResult = await actionCreateAdyenSubscription({
              priceId: product.price.id,
              walletData: {
                name: walletNameRef.current,
                email: walletEmailRef.current,
              },
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
              if (provider === 'googlePay') {
                closeGooglePaySheet(actions);
              } else {
                actions.reject();
              }
              handleFailureOnce(new FailedCardPaymentError(defaultErrorMessage));
              return;
            }

            const paymentResult = result.paymentResult as unknown as CheckoutAdvancedFlowResponse & {
              action?: PaymentAction;
            };
            const action = paymentResult.action;

            if (!action && result.result === 'completed') {
              actions.resolve(paymentResult);
              handleSuccessRef.current(result.transactionId);
              return;
            }

            if (action && provider === 'googlePay' && isThreeDs2Action(action)) {
              actions.resolve({
                resultCode: paymentResult.resultCode,
              });
              setIsCheckoutLoading(false);
              handleGooglePayThreeDsAction(action);
              return;
            }

            if (action && isRedirectAction(action)) {
              setAdyenRedirectSource(provider);
              actions.resolve(paymentResult);
              return;
            }

            if (action) {
              actions.resolve(paymentResult);
              return;
            }

            if (provider === 'googlePay') {
              closeGooglePaySheet(actions);
            } else {
              actions.reject();
            }
            handleFailureOnce(new FailedCardPaymentError(defaultErrorMessage));
          } catch (error) {
            if (provider === 'googlePay') {
              closeGooglePaySheet(actions);
            } else {
              actions.reject();
            }
            handleFailureOnce(error);
          } finally {
            walletNameRef.current = undefined;
            walletEmailRef.current = undefined;
            cleanupAttempt();
          }
        },
        onError: (error) => {
          const isWalletCancellationError = error.name === 'CANCEL';
          if (is3dsInProgressRef.current) {
            cleanupAttempt();
            return;
          }
          if (!isWalletCancellationError) {
            handleFailureOnce(error);
          }
          cleanupAttempt();
        },
      };
    };
    if (checkoutError) {
      teardownWallet(WalletAvailability.Unavailable);
      return;
    }
    const canNotInitialize = !isReady || !checkout || !containerRef.current;

    if (canNotInitialize) {
      return;
    }
    teardownWallet(WalletAvailability.Pending);
    const component = createWalletComponent(provider, checkout, getWalletConfig(), walletConfiguration);
    componentRef.current = component;
    return checkAvailability(component);
  }, [
    defaultErrorMessage,
    checkout,
    checkoutError,
    clearThreeDsAction,
    acquiringCountryCode,
    handleFailureRef,
    handleSuccessRef,
    isReady,
    provider,
    product.price.id,
    setIsCheckoutLoading,
    showThreeDsAction,
    walletConfiguration,
  ]);

  const isUnavailable = availability === WalletAvailability.Unavailable;
  const isLoading = availability === WalletAvailability.Pending;
  const isDisabled = isLoading || isThreeDsActionVisible || isResolvingRedirectResult || isCheckoutLoading;

  return (
    <WalletForm provider={provider} isUnavailable={isUnavailable}>
      <div
        ref={containerRef}
        className={cn('h-full transition-opacity', {
          'opacity-50': isDisabled,
        })}
      />
      {isDisabled ? <div className="absolute inset-0 z-10 cursor-not-allowed" /> : null}
      {isLoading ? (
        <div
          className={cn(
            `
              pointer-events-none absolute inset-0 z-20 grid min-h-12
              place-items-center rounded-[5px] bg-[#000]
            `,
          )}
        >
          <Spinner className={cn('size-5', 'text-white')} />
        </div>
      ) : null}
    </WalletForm>
  );
};
