import { hasLocale, type Locale } from 'next-intl';
import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';

import { SiteConfig } from '@/utils/config';

export const routing = defineRouting({
  defaultLocale: SiteConfig.defaultLocale,
  locales: SiteConfig.locales,
  localePrefix: SiteConfig.localePrefix,
});

/*
 * Route params are plain strings — Next derives them from the directory name,
 * not from what the middleware will accept — while next-intl v4 types `locale`
 * as the union registered in global.ts. This is the one narrowing between the
 * two. A value that is not an enabled locale falls back to the default, which
 * is what the request config does with the same input.
 */
export const resolveLocale = (value: string | undefined): Locale =>
  hasLocale(routing.locales, value) ? value : routing.defaultLocale;

export const { Link, redirect, getPathname, usePathname, useRouter } = createNavigation(routing);
