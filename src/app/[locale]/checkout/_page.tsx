'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import type { FunnelPlan } from '@/actions/funnel-plan';
import CurrencySelector from '@/components/currency-selector';
import CheckoutForm from '@/components/forms/checkout-form';
import { ROUTES } from '@/constants/routes';
import { getCheckoutProduct } from '@/libs/pricing';
import type { Pricing } from '@/types/pricing.types';

import { CancelDescription } from './_components/cancel-description';

type CheckoutPageClientProps = {
  initialCurrency: string;
  formattedNumber: { number: string; valid: boolean };
  country: string;
  pricing: Pricing;
  enableUpsells: boolean;
  plan: FunnelPlan;
};

export const CheckoutPageClient = ({
  initialCurrency,
  formattedNumber,
  country,
  pricing,
  enableUpsells,
  plan,
}: CheckoutPageClientProps) => {
  const t = useTranslations('pages.checkout');

  const [selectedCurrency, setSelectedCurrency] = useState(initialCurrency);

  // Every currency on offer is one the catalogue already priced, so changing it
  // is a selection among prices in hand rather than another request.
  const product = getCheckoutProduct({ pricing, currency: selectedCurrency });

  return (
    <>
      <div className="bg-background-alternate p-4 lg:bg-background">
        <div className="container-content flex items-start justify-between">
          <div>
            <h1 className="mb-1 text-2xl font-bold lg:h3">{t('title')}</h1>
            <div className="text-2xl font-bold text-primary lg:h3 lg:text-primary">{formattedNumber.number}</div>
          </div>
          <CurrencySelector
            value={selectedCurrency}
            currencies={pricing.supportedCurrencies}
            onChange={setSelectedCurrency}
          />
        </div>
      </div>
      <div className="container-content relative px-6 pt-12 lg:rounded-2xl lg:p-12 lg:shadow-raised-lg">
        <CheckoutForm
          country={country}
          product={product}
          buttonText={t('action_form')}
          routeToRedirect={enableUpsells ? ROUTES.SUCCESS_WITH_UPSELLS : ROUTES.SUCCESS}
          plan={plan}
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
