'use client';

import { Elements } from '@stripe/react-stripe-js';
import type { Appearance, StripeElementLocale, StripeElementsOptions } from '@stripe/stripe-js';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

import type { FunnelPlan } from '@/actions/funnel-plan';
import { ROUTES } from '@/constants/routes';
import { useGetProduct } from '@/hooks/api/use-get-product';
import { createPriceFormatter } from '@/hooks/cldr-price-formatter';
import { getStripePromise } from '@/libs/stripe';
import type { Products } from '@/types/products';

import { IconLoaderCircle, IconLockLine } from '../ui/icon/icons';
import { StripeForm } from './stripe-form';

const CheckoutForm = ({
  currency: currentCurrency,
  defaultProduct,
  country,
  isReactivate = false,
  buttonText,
  routeToRedirect = ROUTES.SUCCESS,
  shouldSendOrderConfirmEmail = false,
  isReverseLookupFunnel,
  phoneNumber,
  plan = 'trial',
}: {
  currency: string;
  defaultProduct: Products;
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
  const stripePromise = useMemo(() => getStripePromise(locale as StripeElementLocale), [locale]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [product, setProduct] = useState<Products>(defaultProduct);
  const [currency, setCurrency] = useState(currentCurrency);

  const trialDays = product.trial_days;
  const skipTrial = isReactivate || plan === 'subscription';

  const { mutate: getProduct } = useGetProduct({
    onSuccess: (data) => {
      setCurrency(data.currency);
      setProduct(data);
    },
    onError: (error) => {
      console.error(error);
    },
  });

  const appearance: Appearance = {
    theme: 'stripe',
    variables: { colorPrimaryText: '#f23d00', colorText: '#131625e6' },
  };

  const stripeOptions: StripeElementsOptions = {
    appearance,
    loader: 'auto',
    locale: locale as StripeElementLocale,
  };

  useEffect(() => {
    if (currentCurrency && currentCurrency !== currency) {
      getProduct(currentCurrency);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCurrency]);

  const conditions = t.rich(trialDays === 1 ? 'agree_description_24' : 'agree_description', {
    trialPrice: formatPrice(product?.trial_charge_price || 0, currency, country, locale),
    subscriptionPrice: formatPrice(product?.subscription_price || 0, currency, country, locale),
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
        {skipTrial ? (
          <div className="h4 leading-loose font-bold">
            {formatPrice(product?.subscription_price || 0, currency, country, locale)}
          </div>
        ) : (
          <div className="h4 leading-loose font-bold">
            {formatPrice(product?.trial_charge_price || 0, currency, country, locale)}
          </div>
        )}
      </div>
      <hr className="separator mt-4 mb-6" />
      <Elements stripe={stripePromise} options={stripeOptions}>
        <StripeForm
          buttonText={buttonText}
          currency={currency}
          product={product}
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
              subscriptionPrice: formatPrice(product?.subscription_price || 0, currency, country, locale),
            })
          : skipTrial
            ? t.rich('agree_description_subscription', {
                subscriptionPrice: formatPrice(product?.subscription_price || 0, currency, country, locale),
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
          <IconLockLine className="text-2xl" />
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
          <IconLoaderCircle size="large" className="animate-spin text-primary" />
          <p className="h4">{t('loading')}</p>
        </div>
      )}
    </>
  );
};

export default CheckoutForm;
