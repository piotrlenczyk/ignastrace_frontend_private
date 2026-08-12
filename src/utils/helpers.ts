import { headers } from 'next/headers';

import { AppConfig } from './config';

export const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (
    process.env.VERCEL_ENV === 'production'
    && process.env.VERCEL_PROJECT_PRODUCTION_URL
  ) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'http://localhost:3000';
};

export const getI18nPath = (url: string, locale: string) => {
  if (locale === AppConfig.defaultLocale) {
    return url;
  }

  return `/${locale}${url}`;
};

export const getCurrentPath = (): string => {
  const headersList = headers();
  return headersList.get('x-pathname') || '/';
};

export const getAlternates = (): {
  canonical: string;
  languages: Record<string, string>;
} | null => {
  const headersList = headers();
  const linkHeader = headersList.get('link');

  if (!linkHeader) {
    return null;
  }

  const alternates = linkHeader.split(',').reduce<Record<string, string>>((acc, link) => {
    const matches = link.match(/<([^>]+)>;\s*rel="alternate";\s*hreflang="([^"]+)"/) as [string, string, string] | null;
    if (matches) {
      const [, url, lang] = matches;
      acc[lang] = url;
    }
    return acc;
  }, {});

  if (!('x-default' in alternates)) {
    return null;
  }

  return {
    canonical: alternates['x-default'],
    languages: alternates,
  };
};
