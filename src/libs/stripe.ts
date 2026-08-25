import type { Stripe, StripeElementLocale } from '@stripe/stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import pRetry, { type RetryContext } from 'p-retry';

const stripePromiseByLocaleAndKey = new Map<string, Promise<Stripe | null>>();

/**
 * Stripe initialized from the account the payments catalogue publishes with the
 * price, rather than from a build-time environment variable.
 *
 * A screen quoting a payments price follows the catalogue onto another provider
 * account as a configuration change.
 *
 * The cache exists because of the language: Stripe defaults the 3-D Secure
 * challenge to the browser's own locale unless one is passed to the Stripe.js
 * constructor itself — the `locale` on Elements options localizes only the
 * Elements UI — so an instance is built per language, and caching keeps that from
 * reloading Stripe.js on every render. It is keyed on the publishable key as well,
 * because keying on the language alone would hand back an instance built on
 * whichever key loaded first.
 *
 * It is the only entry point. The environment-keyed loader that stood beside it
 * went with the legacy Stripe form ADR 0030 deleted, and with it the three
 * build-time Stripe publishable variables: every screen that takes a card, and
 * every screen that confirms a charge, now reads the key off the price row it
 * quoted.
 *
 * Stripe.js is served from a third party, so the load is retried: a single failed
 * script fetch would otherwise leave the checkout without a payment form.
 */
export const getStripePromiseForKey = (locale: StripeElementLocale, publishableKey?: string) => {
  if (!publishableKey) {
    throw new Error('The price the payments catalogue published carries no provider public key');
  }

  const cacheKey = `${locale}:${publishableKey}`;
  const cached = stripePromiseByLocaleAndKey.get(cacheKey);
  if (cached) {
    return cached;
  }

  const promise = pRetry(() => loadStripe(publishableKey, { locale }), {
    retries: 5,
    onFailedAttempt: (context: RetryContext) => {
      if (context.retriesLeft === 0) {
        console.error('Stripe load failed after 5 attempts', context.error);
      }
    },
  });
  stripePromiseByLocaleAndKey.set(cacheKey, promise);

  return promise;
};
