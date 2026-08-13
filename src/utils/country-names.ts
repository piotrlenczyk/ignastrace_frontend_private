import { getCountryData, type TCountryCode } from 'countries-list';
import { useLocale } from 'next-intl';

import { localeMap } from '@/components/ui/phone-input/constants';

export function getCountryName(countryCode: string, locale?: string): string {
  if (!countryCode) {
    return countryCode;
  }

  try {
    // Try to get translated name from react-phone-number-input locale
    if (locale) {
      const labels = localeMap[locale as keyof typeof localeMap];
      if (labels && labels[countryCode as keyof typeof labels]) {
        return labels[countryCode as keyof typeof labels] as string;
      }
    }

    // Fallback to countries-list for English names
    const country = getCountryData(countryCode as TCountryCode);
    return country?.name || countryCode;
  } catch {
    return countryCode;
  }
}

export function getCountryNames(countryCodes: (string | undefined)[], locale?: string): string[] {
  return countryCodes.filter((code): code is string => Boolean(code)).map((code) => getCountryName(code, locale));
}

export function useTranslatedCountryNames(countryCodes: (string | undefined)[]): string[] {
  const locale = useLocale();
  return getCountryNames(countryCodes, locale);
}
