import type { CountryCode } from 'libphonenumber-js';
import { useTranslations } from 'next-intl';

import { cn } from '@/libs/utils';

import { PhoneInput } from './phoneInput';

export const Locator = ({
  className,
  defaultCountry,
  labelClassName,
}: {
  className?: string;
  defaultCountry: CountryCode;
  labelClassName?: string;
}) => {
  const t = useTranslations('pages.reverse_lookup.components.phone_input');

  return (
    <div className={cn('text-center', className)}>
      <div className={cn('h4 mb-4 font-bold lg:mb-6', labelClassName)}>{t('label')}</div>
      <PhoneInput defaultCountry={defaultCountry} />
    </div>
  );
};
