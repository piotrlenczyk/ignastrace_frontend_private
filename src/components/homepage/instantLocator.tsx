import type { CountryCode } from 'libphonenumber-js';
import { useTranslations } from 'next-intl';

import { cn } from '@/libs/utils';

import { Locator } from './locator';

export const InstantLocator = (
  { className, defaultCountry, id = 'locator' }:
  { className?: string; defaultCountry: CountryCode; id?: string }) => {
  const t = useTranslations('pages.index.instant_locator');

  const title = t.rich('title', { underlined: chunks => <span className="md-max:scribble">{chunks}</span> });
  return (
    <div className={cn('p-6 lg:rounded-2xl lg:bg-alternate lg:py-24', className)} id={id}>
      <div className="container-wide">
        <h2 className="mb-3 text-center font-bold lg:mb-6 lg:font-normal">
          {title}
        </h2>
        <p className="mx-auto mb-6 max-w-[750px] text-center text-weak lg:mb-16 lg:text-2xl lg:leading-7">
          {t('subtitle')}
        </p>
      </div>
      <Locator defaultCountry={defaultCountry} className="container-content" />
    </div>
  );
};
