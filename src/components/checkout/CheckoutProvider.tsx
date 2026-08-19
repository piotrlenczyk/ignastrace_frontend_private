'use client';

import { useRouter } from 'next/navigation';
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';

import type { paymentsSchemas } from '@/network/payments-api/payments-api-server-client';
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
  submitLabel: string;
  handlePaymentSuccess: () => void;
};

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

/**
 * What every payment component in the island shares: the product being bought,
 * the provider account that will raise the charge, the method the visitor picked
 * and where a completed payment goes.
 *
 * The success route and the submit-button label are inputs rather than
 * derivations. A second screen adopting this island supplies its own two values
 * instead of teaching the provider a new route, and no route constant has to be
 * reachable from here.
 */
export const CheckoutProvider = ({
  children,
  product,
  successRoute,
  submitLabel,
}: {
  children: ReactNode;
  product: ProductWithPrice;
  successRoute: string;
  submitLabel: string;
}) => {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const { adyenGPayEnabled } = useSettings();

  const provider = resolvePaymentProvider(product.price.providerAccount.provider);

  const showGooglePay = provider !== 'adyen' || adyenGPayEnabled;

  /*
   * Navigation and nothing else. The purchase event this used to send returns
   * with the tracking layer — it read a checkout cookie nothing in this
   * application writes, behind an action that is itself a placeholder, so the
   * branch could not execute and is not kept as a trap.
   *
   * The transaction identifier the payment components pass is deliberately
   * dropped rather than appended to the route: nothing reads one, and the
   * upsell success route already carries a query string that appending would
   * corrupt.
   */
  const handlePaymentSuccess = useCallback(() => {
    router.push(successRoute);
  }, [router, successRoute]);

  const value = useMemo(
    () => ({
      provider,
      showGooglePay,
      paymentMethod,
      setPaymentMethod,
      product,
      submitLabel,
      handlePaymentSuccess,
    }),
    [provider, showGooglePay, paymentMethod, setPaymentMethod, product, submitLabel, handlePaymentSuccess],
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
