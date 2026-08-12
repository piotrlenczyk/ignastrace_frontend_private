'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import CurrencySelector from '@/components/currency-selector';
import CheckoutForm from '@/components/forms/checkout-form';
import { ROUTES } from '@/constants/routes';
import type { Products } from '@/types/products';

import { CancelDescription } from './_components/cancel-description';

type LookupCheckoutPageClientProps = {
  currency: string;
  formattedNumber: { number: string; valid: boolean };
  country: string;
  defaultProduct: Products;
  phoneNumber?: string;
};

export const LookupCheckoutPageClient = (
  {
    currency,
    formattedNumber,
    country,
    defaultProduct,
    phoneNumber,
  }: LookupCheckoutPageClientProps) => {
  const t = useTranslations('pages.reverse_lookup.checkout');

  const [selectedCurrency, setSelectedCurrency] = useState(currency);

  return (
    <>
      <div className="bg-background-alternate p-4 lg:bg-background">
        <div className="container-content flex items-start justify-between">
          <div>
            <h1 className="lg:h3 mb-1 text-2xl font-bold">{t('title')}</h1>
            <div className="lg:h3 text-2xl font-bold text-primary lg:text-primary">
              {formattedNumber.number}
            </div>
          </div>
          <CurrencySelector value={selectedCurrency} onChange={setSelectedCurrency} />
        </div>
      </div>
      <div className="container-content lg:shadow-raised-lg relative px-6 pt-12 lg:rounded-2xl lg:p-12">
        <CheckoutForm
          currency={selectedCurrency}
          country={country}
          defaultProduct={defaultProduct}
          buttonText={t('action_form')}
          routeToRedirect={ROUTES.REVERSE_LOOKUP.UPSELLS.PDF}
          isReverseLookupFunnel
          phoneNumber={phoneNumber}
        />
      </div>
      <div className="flex-1 bg-background-alternate p-6 lg:bg-background">
        <div className="container-content flex flex-col gap-6 text-sm text-weak lg:flex-row">
          <div>
            <h3 className="h6 mb-1 font-semibold">{t('cancel_title')}</h3>
            <CancelDescription />
          </div>
        </div>
      </div>
    </>
  );
};
