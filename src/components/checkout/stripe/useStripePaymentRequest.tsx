import { useStripe } from '@stripe/react-stripe-js';
import {
  type CanMakePaymentResult,
  type PaymentRequest,
  type PaymentRequestOptions,
  type PaymentRequestPaymentMethodEvent,
} from '@stripe/stripe-js';
import { useEffect, useState } from 'react';

export const useStripePaymentRequest = ({
  options,
  onPaymentMethod,
}: {
  options: PaymentRequestOptions;
  onPaymentMethod: (event: PaymentRequestPaymentMethodEvent) => void;
}) => {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [canMakePayment, setCanMakePayment] = useState<CanMakePaymentResult | null>();

  useEffect(() => {
    if (stripe && paymentRequest === null) {
      const pr = stripe.paymentRequest(options);
      setPaymentRequest(pr);
    }
  }, [stripe, options, paymentRequest]);

  useEffect(() => {
    let subscribed = true;
    if (paymentRequest) {
      void paymentRequest.canMakePayment().then((result) => {
        if (subscribed) {
          setCanMakePayment(result);
        }
      });
    }

    return () => {
      subscribed = false;
    };
  }, [paymentRequest]);

  useEffect(() => {
    if (paymentRequest) {
      paymentRequest.on('paymentmethod', onPaymentMethod);
    }
    return () => {
      if (paymentRequest) {
        paymentRequest.off('paymentmethod', onPaymentMethod);
      }
    };
  }, [paymentRequest, onPaymentMethod]);
  return {
    canMakePayment,
    paymentRequest,
  };
};
