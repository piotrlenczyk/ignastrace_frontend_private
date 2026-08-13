import type { LocalePrefixMode } from 'next-intl/routing';

const localePrefix: LocalePrefixMode = 'as-needed';

export const LanguageLocale = {
  English: { code: 'en', flag: 'GB', version: 1 },
  Spanish: { code: 'es', flag: 'ES', version: 1 },
  Portuguese: { code: 'pt', flag: 'PT', version: 1 },
  French: { code: 'fr', flag: 'FR', version: 1 },
  Deutsch: { code: 'de', flag: 'DE', version: 1 },
  Italian: { code: 'it', flag: 'IT', version: 1 },
  Dutch: { code: 'nl', flag: 'NL', version: 1 },
  Norwegian: { code: 'no', flag: 'NO', version: 1 },
  Polish: { code: 'pl', flag: 'PL', version: 1 },
  Swedish: { code: 'sv', flag: 'SV', version: 1 },
  Turkish: { code: 'tr', flag: 'TR', version: 1 },
  Romanian: { code: 'ro', flag: 'RO', version: 1 },
  Danish: { code: 'da', flag: 'DK', version: 1 },
  Thai: { code: 'th', flag: 'TH', version: 2 },
  Korean: { code: 'ko', flag: 'KR', version: 2 },
  Ukrainian: { code: 'uk', flag: 'UA', version: 2 },
  Vietnamese: { code: 'vi', flag: 'VN', version: 2 },
  Malaysian: { code: 'ms', flag: 'MY', version: 2 },
  Indonesian: { code: 'id', flag: 'ID', version: 2 },
  Czech: { code: 'cs', flag: 'CZ', version: 3 },
  Croatian: { code: 'hr', flag: 'HR', version: 3 },
  Greek: { code: 'el', flag: 'GR', version: 3 },
  Slovak: { code: 'sk', flag: 'SK', version: 3 },
} as const;

export type LanguageCode = typeof LanguageLocale[keyof typeof LanguageLocale]['code'];

export const getLanguagesByVersion = (version: number = 1) => {
  return Object.entries(LanguageLocale)
    .filter(([_, value]) => value.version <= version)
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {} as typeof LanguageLocale);
};

export const getAllLocaleCodes = () => {
  return Object.values(LanguageLocale).map(locale => locale.code) as LanguageCode[];
};

export const getLanguageVersion = () => {
  const version = process.env.NEXT_PUBLIC_LANGUAGES_VERSION;
  return version ? Number(version) : 1;
};

export const getEnabledLocaleCodes = (version = getLanguageVersion()) => {
  return Object.values(getLanguagesByVersion(version)).map(locale => locale.code);
};

export const SiteConfig = {
  name: 'Mobitrace.io',
  locales: getEnabledLocaleCodes(),
  allLocales: getAllLocaleCodes(),
  defaultLocale: LanguageLocale.English.code,
  localePrefix,
};
