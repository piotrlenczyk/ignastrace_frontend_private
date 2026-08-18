'use client';

// Source: adapted from https://github.com/QR-CODE-App/payments-client-kickstart/ with modifications
import { type Card, type Core, type PaymentAction, type RawPaymentMethod } from '@adyen/adyen-web';
import { createContext, type MutableRefObject, useContext } from 'react';

export type AdyenThreeDsActionCallbacks = {
  onCompleted: (transactionId?: string) => void;
  onFailed: (error: unknown) => void;
};

export type AdyenCheckoutContextValue = {
  checkout: Core | null;
  isReady: boolean;
  cardComponentRef: MutableRefObject<Card | null>;
  error: Error | null;
  paymentMethods: RawPaymentMethod[];
  isThreeDsActionVisible: boolean;
  showThreeDsAction: (action: PaymentAction, callbacks: AdyenThreeDsActionCallbacks) => void;
  clearThreeDsAction: () => void;
};

export const AdyenCheckoutContext = createContext<AdyenCheckoutContextValue>(
  undefined as unknown as AdyenCheckoutContextValue,
);

export const useAdyenCheckout = () => useContext(AdyenCheckoutContext);
