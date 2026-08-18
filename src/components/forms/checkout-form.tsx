'use client';

import { Elements } from '@stripe/react-stripe-js';
import type { Appearance, StripeElementLocale, StripeElementsOptions } from '@stripe/stripe-js';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import type { FunnelPlan } from '@/actions/funnel-plan';
import { Icon } from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';
import { createPriceFormatter } from '@/hooks/cldr-price-formatter';
import { getAmountDue } from '@/libs/pricing';
import { getStripePromiseForKey } from '@/libs/stripe';
import type { ProductWithPrice } from '@/types/pricing.types';

import { StripeForm } from './stripe-form';

const CheckoutForm = ({
  product,
  country,
  isReactivate = false,
  buttonText,
  routeToRedirect = ROUTES.SUCCESS,
  shouldSendOrderConfirmEmail = false,
  isReverseLookupFunnel,
  phoneNumber,
  plan = 'trial',
}: {
  product: ProductWithPrice;
  isReactivate?: boolean;
  country: string;
  buttonText: string;
  routeToRedirect?: string;
  shouldSendOrderConfirmEmail?: boolean;
  isReverseLookupFunnel?: boolean;
  phoneNumber?: string;
  plan?: FunnelPlan;
}) => {
  const t = useTranslations('pages.checkout');

  const formatPrice = createPriceFormatter();
  const locale = useLocale();

  const { price } = product;

  /*
   * Reactivation is quoted like an outright subscription: someone who has
   * subscribed before is not offered the trial again, so the full four-week
   * amount is what falls due.
   */
  const effectivePlan: FunnelPlan = isReactivate || plan === 'subscription' ? 'subscription' : 'trial';
  const skipTrial = effectivePlan === 'subscription';

  /*
   * The currency comes off the price row rather than off the selection, so the
   * amount, the symbol beside it and the currency the legacy API is asked to
   * charge in can never disagree.
   */
  const currency = price.currency;
  const amountDue = getAmountDue({ plan: effectivePlan, price });

  const stripePromise = useMemo(
    () => getStripePromiseForKey(locale as StripeElementLocale, price.providerAccount.clientKey),
    [locale, price.providerAccount.clientKey],
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const appearance: Appearance = {
    theme: 'stripe',
    variables: { colorPrimaryText: '#f23d00', colorText: '#131625e6' },
  };

  const stripeOptions: StripeElementsOptions = {
    appearance,
    loader: 'auto',
    locale: locale as StripeElementLocale,
  };

  const conditions = t.rich(price.trialDays === 1 ? 'agree_description_24' : 'agree_description', {
    trialPrice: formatPrice(price.trialAmount, currency, country, locale),
    subscriptionPrice: formatPrice(price.amount, currency, country, locale),
    terms: (chunks) => (
      <Link target="_blank" href="/terms">
        {chunks}
      </Link>
    ),
    privacy: (chunks) => (
      <Link target="_blank" href="/privacy-policy">
        {chunks}
      </Link>
    ),
  });

  return (
    <>
      <div className="flex items-center justify-between gap-6">
        <div className="text-xl text-weak">{t('total')}</div>
        <div className="h4 leading-loose font-bold">{formatPrice(amountDue, currency, country, locale)}</div>
      </div>
      <hr className="separator mt-4 mb-6" />
      <Elements stripe={stripePromise} options={stripeOptions}>
        <StripeForm
          buttonText={buttonText}
          currency={currency}
          amount={amountDue}
          isReactivate={isReactivate}
          skipTrial={skipTrial}
          isSubmitting={isSubmitting}
          setIsSubmitting={setIsSubmitting}
          shouldSendOrderConfirmEmail={shouldSendOrderConfirmEmail}
          routeToRedirect={routeToRedirect}
          isReverseLookupFunnel={isReverseLookupFunnel}
          phoneNumber={phoneNumber}
        />
      </Elements>
      <p className="mt-6 text-center text-sm">
        {isReactivate
          ? t('agree_description_reactivate', {
              subscriptionPrice: formatPrice(price.amount, currency, country, locale),
            })
          : skipTrial
            ? t.rich('agree_description_subscription', {
                subscriptionPrice: formatPrice(price.amount, currency, country, locale),
                terms: (chunks) => (
                  <Link target="_blank" href="/terms">
                    {chunks}
                  </Link>
                ),
                privacy: (chunks) => (
                  <Link target="_blank" href="/privacy-policy">
                    {chunks}
                  </Link>
                ),
              })
            : conditions}
      </p>
      <div className="mt-4 mb-6 flex items-center justify-between gap-5 text-xs text-weak">
        <div className="flex items-center gap-2">
          <Icon name="safe" className="text-2xl" />
          <span>{t('trust_100')}</span>
        </div>
        <Image
          src="/images/norton.jpg"
          width="100"
          height="28"
          className="h-[23px] w-[82px] lg:h-[28px] lg:w-[100px]"
          alt="Norton Secured powered by VeriSign"
        />
      </div>
      {isSubmitting && (
        <div
          className={`
            fixed inset-0 z-[100] mt-0! grid animate-fade-in place-items-center content-center gap-2 bg-[#fff3]
            text-center backdrop-blur-md will-change-auto
          `}
        >
          <Icon name="reload" className="animate-spin text-primary" />
          <p className="h4">{t('loading')}</p>
        </div>
      )}
    </>
  );
};

export default CheckoutForm;
