import { getRequestConfig } from 'next-intl/server';

import { AppConfig, type LanguageCode, LanguageLocale } from '@/utils/config';

import { routing } from './i18n-routing';
import { titleize } from './utils';

// Using internationalization in Server Components
export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Validate that incoming `locale` parameter is valid
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return { locale, messages: (await import(`../locales/${locale}.json`)).default };
});

// Create DisplayNames instances for each language
const getLocalizedName = (locale: LanguageCode) => {
  const displayNames = new Intl.DisplayNames([locale], { type: 'language' });
  return titleize(displayNames.of(locale) || locale);
};

export const AvailableLanguages = Object.values(LanguageLocale).filter(value => (
  AppConfig.locales.includes(value.code)
)).map(value => ({
  code: value.code,
  name: getLocalizedName(value.code),
  flag: value.flag,
})).sort((a, b) => a.name.localeCompare(b.name));
