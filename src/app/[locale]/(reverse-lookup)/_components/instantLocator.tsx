import type { CountryCode } from 'libphonenumber-js';
import { useTranslations } from 'next-intl';

import { cn } from '@/libs/utils';

import { Locator } from './locator';

export const InstantLocator = (
  { className, defaultCountry, id = 'locator' }:
  { className?: string; defaultCountry: CountryCode; id?: string }) => {
  const t = useTranslations('pages.reverse_lookup.components.instant_locator');

  return (
    <div className={cn('bg-alternate px-4 py-8 lg:rounded-2xl lg:py-24', className)} id={id}>
      <div className="container-wide">
        <h2 className="mb-3 text-center h3 font-bold lg:mb-2">
          {t('title')}
        </h2>
        <p className="mx-auto mb-8 max-w-[750px] text-center text-lg text-weak lg:mb-16">
          {t('subtitle')}
        </p>
      </div>
      <Locator defaultCountry={defaultCountry} className="container-content" />
    </div>
  );
};
