'use client';

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';

import { useCallbackRef } from '@/hooks/use-callback-ref';
import { deleteCheckoutCookie } from '@/libs/checkout-cookie';
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
  submitLabel: string;
  handlePaymentSuccess: (transactionId?: string) => void;
  reportRedirectResolving: (isResolving: boolean) => void;
};

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

/**
 * What every payment component in the island shares: the product being bought,
 * the provider account that will raise the charge, the method the visitor picked
 * and what happens when a payment completes.
 *
 * The success handler and the submit-button label are inputs rather than
 * derivations, and the handler is a callback rather than a route. The island does
 * the part that is true of every sale — end the checkout attempt, report the
 * placed order — and then hands control back, so a screen adopting it says what
 * a completed payment means on that screen instead of teaching the provider a
 * route or a flag. Nothing in here branches on which screen is rendering it.
 */
export const CheckoutProvider = ({
  children,
  product,
  onSuccess,
  onRedirectResolvingChange,
  submitLabel,
}: {
  children: ReactNode;
  product: ProductWithPrice;
  onSuccess: (transactionId?: string) => void;
  onRedirectResolvingChange?: (isResolving: boolean) => void;
  submitLabel: string;
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const { adyenGPayEnabled } = useSettings();

  /*
   * Both callbacks are read through a ref so a caller that declares them inline
   * — which is every caller, since they close over the screen's own state — does
   * not rebuild the context value on every render of the screen and remount the
   * provider's payment form underneath a payment in flight.
   */
  const onSuccessRef = useCallbackRef(onSuccess);
  const onRedirectResolvingChangeRef = useCallbackRef(onRedirectResolvingChange);

  const provider = resolvePaymentProvider(product.price.providerAccount.provider);

  const showGooglePay = provider !== 'adyen' || adyenGPayEnabled;

  /*
   * A completed payment ends the checkout attempt: the record is discarded, the
   * order is reported, and then the screen decides where the visitor goes. The
   * report is fire-and-forget because a payment is finished the moment it is
   * taken — nobody waits on a marketing call to see that.
   *
   * Every argument comes off the price row the charge was raised against, so the
   * report names the catalogue product that was actually billed rather than the
   * plan the funnel offered, and the discarded cookie is not consulted for any of
   * it. The caller's identity is not passed at all: the action reads it from the
   * sealed session, which a page script cannot forge.
   *
   * The report is unconditional, on every screen. The integration this follows
   * fires it only where a checkout-attempt cookie exists, because its cookie
   * carries the event identifier that pairs the two halves of the sale in the
   * marketing platform; ours carries no identifier and the reported product comes
   * off the price row rather than out of the cookie, so the same guard would
   * protect nothing and would make reporting a sale on one funnel depend on a
   * cookie the other funnel writes.
   *
   * The transaction identifier is handed on rather than acted on: what a screen
   * does with it — and whether it can be put in an address at all — is the
   * screen's business.
   */
  const handlePaymentSuccess = useCallback(
    (transactionId?: string) => {
      deleteCheckoutCookie();

      void actionSendPlacedOrderEvent({
        amount: product.price.finalAmount,
        currency: product.price.currency,
        transactionId,
        plan: product.name,
      });

      onSuccessRef.current(transactionId);
    },
    [product, onSuccessRef],
  );

  /*
   * Whether a redirect-based challenge is being resolved right now, told to
   * whoever rendered the island. A screen that can be dismissed — a dialog —
   * needs it: the loading overlay covers the viewport during a payment the
   * visitor started here, but a payment being finished on arrival raises no
   * overlay, and a click on a backdrop would unmount the island mid-completion.
   * A screen that cannot be dismissed passes nothing and is unaffected.
   */
  const reportRedirectResolving = useCallback(
    (isResolving: boolean) => {
      onRedirectResolvingChangeRef.current?.(isResolving);
    },
    [onRedirectResolvingChangeRef],
  );

  const value = useMemo(
    () => ({
      provider,
      showGooglePay,
      paymentMethod,
      setPaymentMethod,
      product,
      submitLabel,
      handlePaymentSuccess,
      reportRedirectResolving,
    }),
    [
      provider,
      showGooglePay,
      paymentMethod,
      setPaymentMethod,
      product,
      submitLabel,
      handlePaymentSuccess,
      reportRedirectResolving,
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
