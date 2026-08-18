'use client';

import { Elements } from '@stripe/react-stripe-js';
import type { Appearance, StripeElementLocale, StripeElementsOptions } from '@stripe/stripe-js';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import type { Product } from '@/app/[locale]/success/_types/product.type';
import { Icon } from '@/components/ui/icon';
import { createPriceFormatter } from '@/hooks/cldr-price-formatter';
import { getStripePromise } from '@/libs/stripe';

import { StripeForm } from './stripe-form';

const UpsellCheckoutForm = ({
  product,
  country,
  buttonText,
  onSuccess,
}: {
  product: Product;
  country: string;
  buttonText: string;
  onSuccess: () => void;
}) => {
  const formatPrice = createPriceFormatter();
  const locale = useLocale();
  const stripePromise = useMemo(() => getStripePromise(locale as StripeElementLocale), [locale]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = useTranslations('pages.checkout');
  const tUpsell = useTranslations('pages.reverse_lookup.report.upsell.payment_message');

  const appearance: Appearance = {
    theme: 'stripe',
    variables: { colorPrimaryText: '#f23d00', colorText: '#131625e6' },
  };

  const stripeOptions: StripeElementsOptions = {
    appearance,
    loader: 'auto',
    locale: locale as StripeElementLocale,
  };

  const handleSuccess = () => {
    onSuccess();
  };

  return (
    <>
      <div className="flex items-center justify-between gap-6">
        <div className="text-xl text-weak">{t('total')}</div>
        <div className="flex items-center gap-2">
          <div className="h4 leading-loose font-bold whitespace-nowrap">
            {formatPrice(product.price, product.currency, country, locale)}
          </div>
          <div className="flex items-center gap-1 text-xs font-bold uppercase">
            <span>{product.currency.toUpperCase()}</span>
          </div>
        </div>
      </div>

      <hr className="separator mt-4 mb-6" />

      <Elements stripe={stripePromise} options={stripeOptions}>
        <StripeForm
          buttonText={buttonText}
          currency={product.currency}
          amount={product.price}
          isUpdatePaymentMethod
          shouldSendOrderConfirmEmail={false}
          isSubmitting={isSubmitting}
          setIsSubmitting={setIsSubmitting}
          onPaymentMethodUpdated={handleSuccess}
        />
      </Elements>

      <div className="my-6 flex justify-center gap-5 text-xs">
        <div className="flex items-center gap-2 text-weak">
          <Icon name="safe" className="text-2xl" />
          {t('trust_100')}
        </div>
        <div className="flex items-center gap-2 text-weak">
          <Icon name="check-circle" className="text-2xl" />
          {t('trust_cancel')}
        </div>
      </div>

      <div className="mb-6 flex items-center justify-center gap-4">
        <Image src="/images/ssl.jpg" width="30" height="34" alt="SSL" />
        <Image src="/images/trust-badge-norton.jpg" width="82" height="48" alt="Norton Secured powered by VeriSign" />
      </div>

      <p className="mb-6 text-center text-xs text-weak">
        {tUpsell.rich('agree_description_upsell', {
          price: formatPrice(product.price, product.currency, country, locale),
          terms: (chunks) => (
            <Link className="underline" target="_blank" href="/terms">
              {chunks}
            </Link>
          ),
          privacy: (chunks) => (
            <Link className="underline" target="_blank" href="/privacy-policy">
              {chunks}
            </Link>
          ),
        })}
      </p>

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

export default UpsellCheckoutForm;
