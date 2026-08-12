import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';

import { AppConfig } from '@/utils/config';

export const routing = defineRouting({
  defaultLocale: AppConfig.defaultLocale,
  locales: AppConfig.locales,
  localePrefix: AppConfig.localePrefix,
});

export const { Link, redirect, getPathname, usePathname, useRouter }
  = createNavigation(routing);
