'use client';

import { Elements, useStripe } from '@stripe/react-stripe-js';
import type { StripeElementLocale } from '@stripe/stripe-js';
import { useLocale } from 'next-intl';
import { createContext, type ReactNode, useCallback, useContext, useMemo } from 'react';

import { mapProviderAccount } from '@/libs/pricing';
import { getStripePromiseForKey } from '@/libs/stripe';
import type { ConfirmationOutcome } from '@/libs/upsell-unlock';
import type { paymentsSchemas } from '@/network/payments-api/payments-api-server-client';

/**
 * Confirming an upsell charge the provider wants the cardholder present for.
 *
 * The default answers `unavailable`, and that is the whole treatment of every
 * provider other than Stripe: the payments service routes some markets to Adyen
 * or NMI, the offer is still made there and a non-authenticated charge still goes
 * through, but a client secret arriving where this application has no instance to
 * present a challenge on is a **failed purchase** rather than a silent success.
 * ADR 0030 records that those two providers have no confirmation path here.
 */
const UpsellConfirmationContext = createContext<(clientSecret: string) => Promise<ConfirmationOutcome>>(
  async () => 'unavailable',
);

/**
 * The confirmation the surface around this component can make, ready to hand to
 * `unlockUpsellWithCredit` or `buyUpsell`.
 */
export const useUpsellConfirmation = () => useContext(UpsellConfirmationContext);

/** Inside the Elements root: the confirmation runs on that Stripe instance. */
const StripeUpsellConfirmation = ({ children }: { children: ReactNode }) => {
  const stripe = useStripe();

  const confirm = useCallback(
    async (clientSecret: string): Promise<ConfirmationOutcome> => {
      if (!stripe) {
        return 'unavailable';
      }

      const { error } = await stripe.confirmCardPayment(clientSecret);

      return error ? 'refused' : 'confirmed';
    },
    [stripe],
  );

  return <UpsellConfirmationContext.Provider value={confirm}>{children}</UpsellConfirmationContext.Provider>;
};

/**
 * The surface an upsell is bought on: a Stripe Elements root where the price row
 * says Stripe, and the children bare where it says anything else.
 *
 * The key comes off the **price's own provider account**, normalised by the same
 * mapping the checkout island's prices go through, so following the catalogue onto
 * another provider account is a configuration change rather than a deploy. Where
 * the row names Stripe but publishes no public key, Stripe is not initialised
 * either — the loader would throw, and an offer is worth more than an exception.
 *
 * No card is collected here: the payments service charges the instrument it holds,
 * and the only thing the Stripe instance is used for is the 3-D Secure
 * confirmation. The Elements root is what puts that instance in context, which is
 * the shape both reference implementations use.
 */
export const UpsellPurchaseSurface = ({
  price,
  children,
}: {
  price: paymentsSchemas['OneOffPriceResponseDto'];
  children: ReactNode;
}) => {
  const locale = useLocale();
  const publishableKey = useMemo(() => mapProviderAccount(price.providerAccount).clientKey, [price.providerAccount]);
  const isStripe = price.providerAccount.provider === 'stripe' && !!publishableKey;

  const stripePromise = useMemo(
    () => (isStripe ? getStripePromiseForKey(locale as StripeElementLocale, publishableKey) : null),
    [isStripe, locale, publishableKey],
  );

  if (!stripePromise) {
    return children;
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        locale: locale as StripeElementLocale,
        mode: 'payment',
        amount: price.amount,
        currency: price.currency.toLowerCase(),
      }}
    >
      <StripeUpsellConfirmation>{children}</StripeUpsellConfirmation>
    </Elements>
  );
};
