'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

import { createPriceFormatter } from '@/hooks/cldr-price-formatter';
import type { ProductWithPrice } from '@/types/pricing.types';

import { Spinner } from '../ui/v2/spinner/spinner';
import { CheckoutLoadingProvider, useCheckoutLoading } from './CheckoutLoadingProvider';
import { CheckoutProvider } from './CheckoutProvider';
import { CheckoutWrapper } from './CheckoutWrapper';
import { SelectPaymentMethod } from './SelectPaymentMethod';

type CheckoutProps = {
  /** The catalogue row the screen quoted, and the row the payment is raised against. */
  product: ProductWithPrice;
  /** The market, for the price format only — the amount itself comes off the row. */
  country: string;
  /** Where a completed payment goes. */
  successRoute: string;
  /** The submit button's copy, so the island states no screen's wording of its own. */
  submitLabel: string;
};

/**
 * The island's composition root: the amount, the method selector, the provider's
 * own form and the recurring-charge consent, over one product.
 *
 * Everything below the provider reads one price row, so the number displayed
 * here and the number the payments service charges are the same number — the
 * price identifier travels with the payment.
 */
export const Checkout = ({ product, country, successRoute, submitLabel }: CheckoutProps) => {
  const t = useTranslations('__NEW__.checkout.CheckoutPage');
  const locale = useLocale();
  const formatPrice = createPriceFormatter();

  const { price } = product;

  return (
    <CheckoutProvider product={product} successRoute={successRoute} submitLabel={submitLabel}>
      <CheckoutLoadingProvider>
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-6">
            <div className="text-xl text-weak">{t('total')}</div>
            <div className="h4 leading-loose font-bold">
              {formatPrice(price.finalAmount, price.currency, country, locale)}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <p className="font-semibold">{t('selectMethod')}</p>
            <SelectPaymentMethod />
          </div>
          <CheckoutWrapper />
          <RecurringChargeConsent product={product} country={country} />
          <CheckoutLoadingOverlay />
        </div>
      </CheckoutLoadingProvider>
    </CheckoutProvider>
  );
};

/**
 * The recurring-charge consent, deliberately on the legacy `pages.checkout`
 * keys rather than new ones.
 *
 * This is a legal statement about what a visitor is agreeing to be charged, not
 * design copy: duplicating it under `__NEW__` would give one obligation two
 * sources of truth that can drift apart. It is re-keyed when the screen is
 * redesigned, and is the one exception on this screen to new work getting new
 * keys.
 */
const RecurringChargeConsent = ({ product, country }: { product: ProductWithPrice; country: string }) => {
  const t = useTranslations('pages.checkout');
  const locale = useLocale();
  const formatPrice = createPriceFormatter();

  const { price } = product;
  const subscriptionPrice = formatPrice(price.amount, price.currency, country, locale);
  const trialPrice = formatPrice(price.trialAmount, price.currency, country, locale);

  const terms = (chunks: React.ReactNode) => (
    <Link target="_blank" href="/terms">
      {chunks}
    </Link>
  );
  const privacy = (chunks: React.ReactNode) => (
    <Link target="_blank" href="/privacy-policy">
      {chunks}
    </Link>
  );

  /*
   * Which wording applies is read off the price row rather than off the funnel's
   * plan, because the row is what the payments service charges from: a product
   * with no trial days is a subscription starting now, whatever the visitor was
   * offered earlier.
   */
  const consent =
    price.trialDays === 0
      ? t.rich('agree_description_subscription', { subscriptionPrice, terms, privacy })
      : t.rich(price.trialDays === 1 ? 'agree_description_24' : 'agree_description', {
          trialPrice,
          subscriptionPrice,
          terms,
          privacy,
        });

  return <p className="text-center text-sm">{consent}</p>;
};

/**
 * What the visitor sees while a payment is in flight.
 *
 * It covers the viewport rather than the island, as the form it replaces did:
 * the currency selector sits outside this component, and switching currency
 * mid-flight would remount the provider on a different price row while a
 * subscription is being created against the old one. The submit button is
 * disabled from the same state, so a second press is prevented by the button
 * and the overlay only has to say what is happening.
 */
const CheckoutLoadingOverlay = () => {
  const t = useTranslations('__NEW__.checkout.CheckoutPage');
  const { isLoading } = useCheckoutLoading();

  if (!isLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-base-blur backdrop-blur-md">
      <Spinner />
      <p className="h4">{t('processing')}</p>
    </div>
  );
};
