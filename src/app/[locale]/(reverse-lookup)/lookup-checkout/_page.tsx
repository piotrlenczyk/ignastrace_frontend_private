'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useCreateReverseLookupMutation } from '@/app/[locale]/memberarea/(reverse-lookup)/phone-lookup/hooks/api/use-create-reverse-lookup-mutation';
import { Checkout } from '@/components/checkout/Checkout';
import CurrencySelector from '@/components/currency-selector';
import { PaymentTrustRow } from '@/components/payment-trust-row';
import { ROUTES } from '@/constants/routes';
import { useRouter } from '@/libs/i18n-routing';
import { getCurrencyProducts, getPlanProductName, getPricingProduct } from '@/libs/pricing';
import type { Pricing } from '@/types/pricing.types';

import { CancelDescription } from './_components/cancel-description';

type LookupCheckoutPageClientProps = {
  initialCurrency: string;
  formattedNumber: { number: string; valid: boolean };
  country: string;
  pricing: Pricing;
  phoneNumber?: string;
};

export const LookupCheckoutPageClient = ({
  initialCurrency,
  formattedNumber,
  country,
  pricing,
  phoneNumber,
}: LookupCheckoutPageClientProps) => {
  const t = useTranslations('pages.reverse_lookup.checkout');
  const router = useRouter();

  const [selectedCurrency, setSelectedCurrency] = useState(initialCurrency);

  /*
   * This funnel sells the trial and only the trial. The plan is stated here
   * rather than read off the checkout attempt on purpose: that record belongs to
   * the other funnel, and a plan chosen there must not raise the price quoted
   * here. Nothing is written back to it either — the currency selector on this
   * screen records nothing, so switching currency stays a selection among prices
   * already in hand.
   */
  const product = getPricingProduct({
    plan: getPlanProductName('trial'),
    currencyProducts: getCurrencyProducts({ products: pricing.products, currency: selectedCurrency }),
  });

  /*
   * The reverse lookup the visitor just paid for, created through the legacy API
   * — the same call this screen has always made. The whole downstream funnel
   * reads that record from the same upstream, so creating it on the new API's own
   * reverse-lookup endpoint would strand the report the visitor is on their way
   * to.
   *
   * A refused creation still sends them onward, which is today's behaviour and
   * the right one: their money has moved, and stranding them on a payment screen
   * is the one outcome worse than a report that has to be retried.
   */
  const { mutate: createReverseLookup } = useCreateReverseLookupMutation({
    onSuccess: () => router.push(ROUTES.REVERSE_LOOKUP.UPSELLS.PDF),
    onError: () => router.push(ROUTES.REVERSE_LOOKUP.UPSELLS.PDF),
  });

  const handlePaymentSuccess = () => {
    if (!phoneNumber) {
      router.push(ROUTES.REVERSE_LOOKUP.UPSELLS.PDF);
      return;
    }

    createReverseLookup(phoneNumber);
  };

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
        <Checkout product={product} country={country} onSuccess={handlePaymentSuccess} submitLabel={t('action_form')} />
        <PaymentTrustRow />
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
