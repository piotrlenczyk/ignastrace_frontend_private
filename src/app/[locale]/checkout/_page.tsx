'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import type { FunnelPlan } from '@/actions/funnel-plan';
import { Checkout } from '@/components/checkout/Checkout';
import CurrencySelector from '@/components/currency-selector';
import { Icon } from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';
import { getCurrencyProducts, getPlanProductName, getPricingProduct } from '@/libs/pricing';
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
  const tCheckout = useTranslations('__NEW__.checkout.CheckoutPage');

  const [selectedCurrency, setSelectedCurrency] = useState(initialCurrency);

  /*
   * The funnel's plan selects the catalogue product, not one of two amounts on a
   * row: the payments service derives what is charged from the price identifier
   * it is handed, so the product carrying the right amount is the only way to
   * say "no trial". Every currency on offer is one the catalogue already priced,
   * so changing it is a selection among prices in hand rather than another
   * request.
   */
  const product = getPricingProduct({
    plan: getPlanProductName(plan),
    currencyProducts: getCurrencyProducts({ products: pricing.products, currency: selectedCurrency }),
    currency: selectedCurrency,
  });

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
        <Checkout
          product={product}
          country={country}
          successRoute={enableUpsells ? ROUTES.SUCCESS_WITH_UPSELLS : ROUTES.SUCCESS}
          submitLabel={tCheckout('action')}
        />
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
