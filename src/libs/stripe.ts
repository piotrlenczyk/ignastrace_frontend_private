import type { Stripe, StripeElementLocale } from '@stripe/stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const isUseLemonStripe = process.env.NEXT_PUBLIC_USE_LEMON_STRIPE === '1';
const stripePublishableKey = isUseLemonStripe
  ? process.env.NEXT_PUBLIC_LEMON_STRIPE_PUBLISHABLE_KEY
  : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

const stripePromiseByLocale = new Map<string, Promise<Stripe | null>>();

// Stripe defaults the 3D Secure challenge modal to the browser/account's
// auto-detected locale unless a `locale` is passed to the Stripe.js constructor
// itself (the `locale` on Elements options only localizes the Elements/Payment
// Element UI, not the 3DS challenge). Caching by locale avoids reloading
// Stripe.js on every render while still keeping the 3DS modal in the site's language.
export const getStripePromise = (locale: StripeElementLocale) => {
  const cached = stripePromiseByLocale.get(locale);
  if (cached) {
    return cached;
  }

  const promise = loadStripe(stripePublishableKey || '', { locale });
  stripePromiseByLocale.set(locale, promise);

  return promise;
};

const stripePromiseByLocaleAndKey = new Map<string, Promise<Stripe | null>>();

/**
 * Stripe initialized from the account the payments catalogue publishes with the
 * price, rather than from a build-time environment variable.
 *
 * A screen quoting a payments price follows the catalogue onto another provider
 * account as a configuration change. The cache is keyed on the key as well as
 * the language, because caching by language alone would hand back an instance
 * built on whichever key loaded first — the 3D Secure localization above is the
 * reason a cache exists at all, and it must not cost correctness.
 *
 * The environment-variable entry point above stays for the upsell purchase form,
 * which has no payments price to read a key from.
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

  const promise = loadStripe(publishableKey, { locale });
  stripePromiseByLocaleAndKey.set(cacheKey, promise);

  return promise;
};
