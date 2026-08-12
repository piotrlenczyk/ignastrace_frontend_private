import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import createMiddleware from 'next-intl/middleware';

import { AUTH_ROUTES, PROTECTED_ROUTES } from '@/constants/routes';
import { routing } from '@/libs/i18n-routing';
import { AppConfig, type LanguageCode } from '@/utils/config';

const intlMiddleware = createMiddleware(routing);

async function isAuthenticated(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });
  return !!token;
}

const isPublicRoute = (pathname: string) => {
  return (
    !pathname.match(`^\/([a-z]{2}\/)?(?:${PROTECTED_ROUTES.join('|')})`)
    || pathname.startsWith('/api')
  );
};

const isAuthRoute = (pathname: string) => {
  return (
    pathname.match(`^\/([a-z]{2}\/)?(?:${AUTH_ROUTES.join('|')})$`) !== null
  );
};

const redirectDisabledLocale = (request: NextRequest) => {
  const localeMatch = request.nextUrl.pathname.match(/^\/([a-z]{2})(\/|$)/);
  const locale = localeMatch?.[1] as LanguageCode | undefined;

  if (!locale || !AppConfig.allLocales.includes(locale) || AppConfig.locales.includes(locale)) {
    return null;
  }

  const url = request.nextUrl.clone();
  url.pathname = request.nextUrl.pathname.replace(`/${locale}`, '') || '/';

  return NextResponse.redirect(url);
};

export default async function handleAuthAndIntl(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const disabledLocaleRedirect = redirectDisabledLocale(request);

  if (disabledLocaleRedirect) {
    return disabledLocaleRedirect;
  }

  // Bypass authentication for public routes except auth routes
  if (isPublicRoute(pathname) && !isAuthRoute(pathname)) {
    return intlMiddleware(request);
  }

  const authenticated = await isAuthenticated(request);

  // Redirect to home if authenticated and on auth route
  if (authenticated && isAuthRoute(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Proceed with intl middleware for authenticated requests
  if (!authenticated && isAuthRoute(pathname)) {
    return intlMiddleware(request);
  }

  if (!authenticated) {
  // Redirect to sign-in if not authenticated
    const localeMatch = pathname.match(/^\/([a-z]{2})\//);
    const locale = localeMatch ? localeMatch[1] : '';

    const signInUrl = new URL(
      `/${locale ? `${locale}/` : ''}sign-in`,
      request.url,
    );
    return NextResponse.redirect(signInUrl);
  }

  return intlMiddleware(request);
}
