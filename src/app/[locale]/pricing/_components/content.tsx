import type { CountryCode } from 'libphonenumber-js';
import { useLocale, useTranslations } from 'next-intl';

import { FAQs } from '@/components/homepage/faqs';
import { InstantLocator } from '@/components/homepage/instantLocator';
import { createPriceFormatter } from '@/hooks/cldr-price-formatter';
import type { Products } from '@/types/products';

import { PricingHero } from './hero';
import { PricingCard } from './pricing-card';

export function PricingContent({
  country,
  currency,
  products,
}: { country: CountryCode; currency: string; products: Products }) {
  const t = useTranslations('pages.pricing.cards');
  const formatPrice = createPriceFormatter();
  const locale = useLocale();

  const trialPrice = formatPrice(products.trial_charge_price, currency, country, locale);
  const subscriptionPrice = formatPrice(products.subscription_price, currency, country, locale);
  const trialDays = products.trial_days;

  return (
    <>
      <PricingHero country={country} price={trialPrice} trialDays={trialDays} />

      <div className="container-wide flex flex-col px-4 py-8 lg:px-1">
        <h1 className="mb-4 h1 lg:mb-8">
          { t('title') }
        </h1>
        <div className="grid gap-4 md:grid-cols-2 md:gap-8">
          <PricingCard
            type="trial"
            price={trialPrice}
            description={
              t(trialDays === 1 ? 'trial_24.description' : 'trial.description', { price: subscriptionPrice }) as any
            }
            trialDays={trialDays}
          />
          <PricingCard
            type="subscription"
            price={subscriptionPrice}
            description={
              t(trialDays === 1
                ? 'subscription_24.description'
                : 'subscription.description', { price: subscriptionPrice })
            }
            trialDays={trialDays}
          />
        </div>
      </div>

      <FAQs className="container-wide">
        <div className="mx-4 border-t border-solid border-t-gray-100 py-6 md:py-16">
          <FAQs.Title />
          <FAQs.Content className="rounded-3xl bg-alternate px-4 py-3 lg:px-10 lg:py-4" />
        </div>
      </FAQs>

      <InstantLocator
        defaultCountry={country}
      />
    </>
  );
}
