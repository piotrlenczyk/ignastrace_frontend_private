'use client';

// Source: adapted from https://github.com/QR-CODE-App/payments-client-kickstart/ with modifications
import '@adyen/adyen-web/styles/adyen.css';

import {
  AdyenCheckout,
  type Card,
  type Core,
  type CoreConfiguration,
  type PaymentAction,
  type RawPaymentMethod,
} from '@adyen/adyen-web';
import { useLocale, useTranslations } from 'next-intl';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import { actionLoadAdyenPaymentMethods } from '@/server/actions/adyen.actions';
import { createPromiseCache } from '@/utils/promise-cache.utils';

import { Adyen3dsAction } from './Adyen3dsAction';
import { Adyen3DsActionModal } from './Adyen3DsActionModal';
import { getAmountNormalizedForAdyen } from './adyenAmountNormalization.helper';
import { AdyenCheckoutContext, type AdyenThreeDsActionCallbacks } from './AdyenCheckoutContext';
import { FailedCardPaymentError } from './paymentErrors';

type AdyenCheckoutProviderProps = {
  priceId: string;
  clientKey: string;
  amount: { value: number; currency: string };
  children: ReactNode;
};

type ThreeDsActionRequest = {
  action: PaymentAction;
};

type CheckoutBootstrap = {
  checkout: Awaited<ReturnType<typeof AdyenCheckout>>;
  paymentMethods: RawPaymentMethod[];
};

type BootstrapAdyenCheckoutParams = {
  priceId: string;
  clientKey: string;
  amountValue: number;
  amountCurrency: string;
  locale: string;
};

type CheckoutBootstrapCacheKey = {
  clientKey: string;
  locale: string;
};

const checkoutBootstrapCache = createPromiseCache<CheckoutBootstrapCacheKey, CheckoutBootstrap>();

const ADYEN_LOCALE_MAP: Record<string, string> = {
  en: 'en-US',
  es: 'es-ES',
};

const buildConfig = ({
  clientKey,
  amountValue,
  amountCurrency,
  locale,
  loadResult,
}: {
  clientKey: string;
  amountValue: number;
  amountCurrency: string;
  locale: string;
  loadResult: {
    paymentMethodsResponse: Record<string, never>;
    countryCode: string;
    environment: string;
  };
}): CoreConfiguration => ({
  clientKey,
  locale: ADYEN_LOCALE_MAP[locale] ?? locale,
  environment: loadResult.environment as CoreConfiguration['environment'],
  countryCode: loadResult.countryCode,
  paymentMethodsResponse: loadResult.paymentMethodsResponse as CoreConfiguration['paymentMethodsResponse'],
  showPayButton: false,
  amount: {
    value: getAmountNormalizedForAdyen(amountValue, amountCurrency),
    currency: amountCurrency,
  },
});

const bootstrapAdyenCheckout = async ({
  priceId,
  clientKey,
  amountValue,
  amountCurrency,
  locale,
}: BootstrapAdyenCheckoutParams): Promise<CheckoutBootstrap> => {
  return checkoutBootstrapCache.get({ clientKey, locale }, async () => {
    const actionResult = await actionLoadAdyenPaymentMethods({ priceId });
    const loadResult = actionResult?.data;
    if (!loadResult) {
      throw new Error('Failed to load Adyen payment methods');
    }
    const config = buildConfig({
      clientKey,
      amountValue,
      amountCurrency,
      locale,
      loadResult,
    });
    const paymentMethods =
      (
        loadResult.paymentMethodsResponse as unknown as {
          paymentMethods: RawPaymentMethod[];
        }
      ).paymentMethods ?? [];
    const checkout = await AdyenCheckout(config);

    return {
      checkout,
      paymentMethods,
    };
  });
};

export function AdyenCheckoutProvider({ priceId, clientKey, amount, children }: AdyenCheckoutProviderProps) {
  const locale = useLocale();
  const t = useTranslations('__NEW__.checkout.CheckoutPage');
  const [checkout, setCheckout] = useState<Core | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<RawPaymentMethod[]>([]);
  const [threeDsActionRequest, setThreeDsActionRequest] = useState<ThreeDsActionRequest | null>(null);

  const isReady = Boolean(checkout);

  const cardComponentRef = useRef<Card | null>(null);
  const callbacksRef = useRef<AdyenThreeDsActionCallbacks | null>(null);

  const clearThreeDsAction = useCallback(() => {
    callbacksRef.current = null;
    setThreeDsActionRequest(null);
  }, []);

  const showThreeDsAction = useCallback((action: PaymentAction, callbacks: AdyenThreeDsActionCallbacks) => {
    callbacksRef.current = callbacks;
    setThreeDsActionRequest({ action });
  }, []);

  const handleSetThreeDsAction = useCallback(
    (action: PaymentAction | null) => {
      if (!action) {
        clearThreeDsAction();
        return;
      }

      setThreeDsActionRequest((current) => {
        if (current) {
          return { ...current, action };
        }
        return { action };
      });
    },
    [clearThreeDsAction],
  );

  const handleThreeDsCompleted = useCallback(
    (transactionId?: string) => {
      const callbacks = callbacksRef.current;
      if (!callbacks) {
        return;
      }
      clearThreeDsAction();
      callbacks.onCompleted(transactionId);
    },
    [clearThreeDsAction],
  );

  const handleThreeDsFailed = useCallback(
    (error: unknown) => {
      const callbacks = callbacksRef.current;
      if (!callbacks) {
        return;
      }
      clearThreeDsAction();
      callbacks.onFailed(error);
    },
    [clearThreeDsAction],
  );

  const handleModalOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        const callbacks = callbacksRef.current;
        clearThreeDsAction();
        if (callbacks) {
          callbacks.onFailed(new FailedCardPaymentError(t('paymentGenericError')));
        }
      }
    },
    [clearThreeDsAction, t],
  );

  useEffect(() => {
    if (checkout && checkout.options.clientKey === clientKey) {
      return;
    }

    let cancelled = false;

    bootstrapAdyenCheckout({
      priceId,
      clientKey,
      amountValue: amount.value,
      amountCurrency: amount.currency,
      locale,
    })
      .then(({ checkout, paymentMethods }) => {
        if (cancelled) {
          return;
        }
        setCheckout(checkout);
        setPaymentMethods(paymentMethods);
        setError(null);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setCheckout(null);
        setPaymentMethods([]);
        setError(error instanceof Error ? error : new Error('Failed to init Adyen Checkout'));
        clearThreeDsAction();
        console.error('[AdyenCheckoutProvider] Failed to init Adyen Checkout', error);
      });

    return () => {
      cancelled = true;
    };
  }, [amount.currency, amount.value, checkout, clearThreeDsAction, clientKey, locale, priceId]);

  useEffect(() => {
    if (!checkout || checkout.options.clientKey !== clientKey) {
      return;
    }

    let cancelled = false;

    const updatePaymentMethods = () =>
      actionLoadAdyenPaymentMethods({ priceId })
        .then((actionResult) => {
          if (cancelled) {
            return;
          }
          const loadResult = actionResult?.data;
          if (loadResult) {
            const methods =
              (
                loadResult.paymentMethodsResponse as unknown as {
                  paymentMethods: RawPaymentMethod[];
                }
              ).paymentMethods ?? [];
            setPaymentMethods(methods);
          }
        })
        .catch((error) => {
          console.error('[AdyenCheckoutProvider] Failed to load payment methods', error);
        });

    void updatePaymentMethods();

    return () => {
      cancelled = true;
    };
  }, [checkout, clientKey, priceId]);

  useEffect(() => {
    if (!checkout || checkout.options.clientKey !== clientKey) {
      return;
    }

    const currAmount = checkout.options.amount;
    const hasPriceChanged = currAmount?.value !== amount.value || currAmount?.currency !== amount.currency;
    if (!hasPriceChanged) {
      return;
    }

    const updateAmount = () =>
      checkout
        .update(
          {
            amount: {
              value: getAmountNormalizedForAdyen(amount.value, amount.currency),
              currency: amount.currency,
            },
          },
          { shouldReinitializeCheckout: false },
        )
        .catch((error) => {
          console.error('[AdyenCheckoutProvider] Failed to update amount', error);
        });

    void updateAmount();
  }, [amount.currency, amount.value, checkout, clientKey]);

  return (
    <AdyenCheckoutContext.Provider
      value={{
        checkout,
        isReady,
        error,
        cardComponentRef,
        paymentMethods,
        isThreeDsActionVisible: Boolean(threeDsActionRequest),
        showThreeDsAction,
        clearThreeDsAction,
      }}
    >
      {children}
      <Adyen3DsActionModal isOpen={Boolean(threeDsActionRequest)} setIsOpen={handleModalOpenChange}>
        {threeDsActionRequest ? (
          <Adyen3dsAction
            action={threeDsActionRequest.action}
            defaultErrorMessage={t('paymentGenericError')}
            setAction={handleSetThreeDsAction}
            onCompleted={handleThreeDsCompleted}
            onFailed={handleThreeDsFailed}
          />
        ) : null}
      </Adyen3DsActionModal>
    </AdyenCheckoutContext.Provider>
  );
}
