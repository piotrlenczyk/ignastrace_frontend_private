import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { routing } from '@/libs/i18n-routing';
import { type LanguageCode, SiteConfig } from '@/utils/config';

const intlMiddleware = createMiddleware(routing);

/*
 * A locale this deployment has switched off is stripped from the URL rather
 * than served, so that turning a language off retires its URLs too.
 */
const redirectDisabledLocale = (request: NextRequest) => {
  const localeMatch = request.nextUrl.pathname.match(/^\/([a-z]{2})(\/|$)/);
  const locale = localeMatch?.[1] as LanguageCode | undefined;

  if (!locale || !SiteConfig.allLocales.includes(locale) || SiteConfig.locales.includes(locale)) {
    return null;
  }

  const url = request.nextUrl.clone();
  url.pathname = request.nextUrl.pathname.replace(`/${locale}`, '') || '/';

  return NextResponse.redirect(url);
};

/**
 * The internationalisation step of the middleware chain. It is responsible for
 * locale handling only — the route guards it used to be fused with are the
 * redirects step now.
 */
export const handleIntl = (request: NextRequest): NextResponse =>
  redirectDisabledLocale(request) ?? intlMiddleware(request);
