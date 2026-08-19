'use client';

import { useRouter } from 'next/navigation';
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';

import { buildRoute } from '@/components/checkout/_shared/stubs/routes';
import { deleteCheckoutCookie, getCheckoutCookie } from '@/libs/checkout-cookie';
import type { paymentsSchemas } from '@/network/payments-api/payments-api-server-client';
import { actionSendPlacedOrderEvent } from '@/server/actions/subscription.actions';
import { useSettings } from '@/settings/settings.provider';
import type { ProductWithPrice, ProviderAccount } from '@/types/pricing.types';

export const SUPPORTED_PAYMENT_PROVIDERS = [
  'stripe' satisfies paymentsSchemas['PaymentProviderEnum'],
  'adyen' satisfies paymentsSchemas['PaymentProviderEnum'],
] as const;

export type SupportedPaymentProvider = (typeof SUPPORTED_PAYMENT_PROVIDERS)[number];
export type PaymentMethod = 'card' | 'applePay' | 'googlePay';

const resolvePaymentProvider = (provider: ProviderAccount['provider']): SupportedPaymentProvider | null =>
  SUPPORTED_PAYMENT_PROVIDERS.find((supported): supported is SupportedPaymentProvider => supported === provider) ??
  null;

type CheckoutContextType = {
  provider: SupportedPaymentProvider | null;
  showGooglePay: boolean;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (paymentMethod: PaymentMethod) => void;
  product: ProductWithPrice;
  shouldShowUpsell?: boolean;
  handlePaymentSuccess: (transactionId?: string) => void;
  isCoverLetter?: boolean;
};

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

export const CheckoutProvider = ({
  children,
  email,
  product,
  shouldShowUpsell = false,
  isCoverLetter = false,
}: {
  children: ReactNode;
  email: string;
  product: ProductWithPrice;
  shouldShowUpsell?: boolean;
  isCoverLetter?: boolean;
}) => {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const { adyenGPayEnabled } = useSettings();

  const provider = resolvePaymentProvider(product.price.providerAccount.provider);

  const showGooglePay = provider !== 'adyen' || adyenGPayEnabled;

  const getPaymentSuccessRoute = useCallback(
    (transactionId?: string) => {
      return shouldShowUpsell
        ? buildRoute.billingCheckoutSuccess({
            transactionId,
          })
        : buildRoute.billingCheckoutThankYou({
            transactionId,
          });
    },
    [shouldShowUpsell],
  );

  const handlePaymentSuccess = useCallback(
    (transactionId?: string) => {
      // TODO: [refactor] add GTM tracking
      // GTMService.trackPurchase({
      //   transactionId: transactionId ?? '',
      //   actualValue: product.price.finalAmount,
      //   currency: product.price.currency,
      //   email,
      //   provider,
      // });

      const checkoutData = getCheckoutCookie();
      if (checkoutData) {
        deleteCheckoutCookie();
        void actionSendPlacedOrderEvent({
          amount: product.price.finalAmount,
          currency: product.price.currency,
          transactionId: transactionId ?? '',
          plan: checkoutData.plan,
          email,
        });
      }

      const route = getPaymentSuccessRoute(transactionId);
      router.push(route);
    },
    [email, getPaymentSuccessRoute, product.price, router],
  );

  const value = useMemo(
    () => ({
      provider,
      showGooglePay,
      paymentMethod,
      setPaymentMethod,
      product,
      shouldShowUpsell,
      handlePaymentSuccess,
      isCoverLetter,
    }),
    [
      isCoverLetter,
      provider,
      showGooglePay,
      paymentMethod,
      setPaymentMethod,
      product,
      shouldShowUpsell,
      handlePaymentSuccess,
    ],
  );

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>;
};

export const useCheckout = () => {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error('useCheckout must be used within CheckoutProvider');
  }
  return context;
};
