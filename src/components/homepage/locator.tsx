import clsx from 'clsx';
import type { CountryCode } from 'libphonenumber-js';
import { useTranslations } from 'next-intl';

import { PhoneInput } from './phoneInput';

export const Locator = (
  {
    className,
    defaultCountry,
    labelClassName,
  }: { className?: string; defaultCountry: CountryCode; labelClassName?: string }) => {
  const t = useTranslations('components.phone_input');

  return (
    <div className={clsx('text-center', className)}>
      <div className={clsx('h4 mb-6', labelClassName)}>
        {t('label')}
      </div>
      <PhoneInput defaultCountry={defaultCountry} />
    </div>
  );
};
