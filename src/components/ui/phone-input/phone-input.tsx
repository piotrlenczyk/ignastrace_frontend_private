'use client';

import type { CountryCode, E164Number } from 'libphonenumber-js';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import * as React from 'react';
import * as RPNInput from 'react-phone-number-input';

import { cn } from '@/libs/utils';
import { formatPhoneNumberPlaceholder } from '@/utils/formatPhoneNumberPlaceholder';

import { localeMap } from './constants';
import { CountrySelect } from './country-select';
import { FlagComponent } from './flag-component';
import { InputComponent } from './input-component';
import type { PhoneInputProps } from './types';

const PhoneInput: React.ForwardRefExoticComponent<PhoneInputProps>
  = React.forwardRef<React.ElementRef<typeof RPNInput.default>, PhoneInputProps>(
    ({ className, onChange, onSelectCountry, ...props }, ref) => {
      const locale = useLocale();
      const labels = React.useMemo(() => {
        return localeMap[locale as keyof typeof localeMap];
      }, [locale]);
      const searchParams = useSearchParams();
      const country = searchParams.get('country') || props.defaultCountry || 'GB';

      const [placeholder, setPlaceholder] = React.useState(formatPhoneNumberPlaceholder(props.defaultCountry as CountryCode));

      const handlePlaceholderChange = React.useCallback(
        (countryCode: CountryCode) => {
          setPlaceholder(formatPhoneNumberPlaceholder(countryCode));
        },
        [onChange],
      );

      const handleCountryChange = React.useCallback(
        (value: CountryCode) => {
          onSelectCountry?.(value);
          handlePlaceholderChange(value);
        },
        [onSelectCountry, handlePlaceholderChange],
      );

      return (
        <RPNInput.default
          ref={ref}
          className={cn('phone-input-input flex w-full items-center gap-1 py-1', className)}
          flagComponent={FlagComponent}
          countrySelectComponent={CountrySelect}
          inputComponent={InputComponent}
          defaultCountry={country as CountryCode}
          labels={labels}
          placeholder={placeholder}
          name="phoneNumber"
          onChange={value => onChange?.(value || ('' as E164Number))}
          onCountryChange={handleCountryChange}
          {...props}
        />
      );
    },
  );

PhoneInput.displayName = 'PhoneInput';

export { PhoneInput };
