'use client';

import { loadStripe, type StripeElementLocale } from '@stripe/stripe-js';
import { useLocale } from 'next-intl';
import pRetry, { type RetryContext } from 'p-retry';
import { useRef } from 'react';

export const useStripePromiseRef = (publicKey: string) => {
  const locale = useLocale();
  const retryOptions = {
    onFailedAttempt: (context: RetryContext) => {
      if (context.retriesLeft === 0) {
        console.error(`Stripe load failed after 5 attempts`, context.error);
      }
    },
    retries: 5,
  };

  const stripePromiseRef = useRef(
    pRetry(
      () =>
        loadStripe(publicKey, {
          locale: locale as StripeElementLocale,
        }),
      retryOptions,
    ),
  );

  return stripePromiseRef;
};
