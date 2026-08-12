import type { CountryCode } from 'libphonenumber-js';
import { useLocale, useTranslations } from 'next-intl';

import { useCldrFormatPrice } from '@/hooks/use-cldr-format-price';
import type { Products } from '@/types/products';

import { PricingCard } from './pricing-card';

export function PricingContent({
  country,
  currency,
  products,
}: { country: CountryCode; currency: string; products: Products }) {
  const t = useTranslations('pages.reverse_lookup.components.pricing.cards');
  const formatPrice = useCldrFormatPrice();
  const locale = useLocale();
  const trialPrice = formatPrice(products.trial_charge_price, currency, country, locale);
  const subscriptionPrice = formatPrice(products.subscription_price, currency, country, locale);

  return (
    <div className="container-wide px-4 pt-8 lg:px-0 lg:py-20">
      <h1 className="h3 mb-8 text-center font-bold">
        { t('title') }
      </h1>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8">
        <PricingCard
          type="trial"
          price={trialPrice}
          description={t('trial.description', { price: subscriptionPrice })}
        />
        <PricingCard
          type="subscription"
          price={subscriptionPrice}
          description={t('subscription.description', { price: subscriptionPrice })}
        />
      </div>
    </div>
  );
}
