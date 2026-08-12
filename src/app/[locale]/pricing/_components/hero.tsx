import type { CountryCode } from 'libphonenumber-js';
import { useTranslations } from 'next-intl';

import { HeroLocator } from '@/components/homepage/hero';

export function PricingHero(
  {
    country,
    price,
    trialDays,
  }:
  { country: CountryCode; price: string; trialDays: number },
) {
  const t = useTranslations('pages.pricing');

  const title = t.rich(trialDays === 1 ? 'title_24' : 'title', {
    mark: chunks => (
      <mark className="text-nowrap text-brand">{chunks}</mark>
    ),
    price,
  });

  return (
    <section
      className="overflow-hidden bg-alternate bg-[-415px_-30px] bg-no-repeat px-6 lg:rounded-3xl lg:bg-[170px_-115px]"
      style={{ backgroundImage: 'url(/images/hero/map.png)' }}
    >
      <div className="mx-auto flex w-full max-w-[1152px] flex-col items-start
       gap-6 py-10 md:items-center md:text-center"
      >
        <div className=" rounded-full bg-secondary px-3 py-1 text-white">
          {t('special_offer')}
        </div>
        <h1 className="display-mini break-words md:text-[56px]">
          { title }
        </h1>
        <p>{t('subtitle')}</p>
        <HeroLocator defaultCountry={country} className="container-content" />
      </div>
    </section>
  );
};
