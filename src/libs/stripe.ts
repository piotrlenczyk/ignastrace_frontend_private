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
