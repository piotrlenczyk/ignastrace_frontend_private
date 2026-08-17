import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { match } from 'path-to-regexp';

import { AUTH_ROUTE_PATTERNS, PROTECTED_ROUTE_PATTERNS, REDIRECT_QUERY_PARAM, ROUTES } from '@/constants/routes';
import type { SessionData } from '@/server/session/session.types';
import { SiteConfig } from '@/utils/config';

const compile = (patterns: string[]) => patterns.map((pattern) => match(pattern));

const protectedRoutes = compile(PROTECTED_ROUTE_PATTERNS);
const authRoutes = compile(AUTH_ROUTE_PATTERNS);

const isKnownLocale = (value: unknown): boolean =>
  typeof value === 'string' && (SiteConfig.allLocales as string[]).includes(value);

/*
 * The optional locale segment in the patterns matches any single segment, so a
 * match is only a match when whatever it captured is actually a locale —
 * otherwise `/anything/memberarea` would be read as a member-area URL.
 */
const matches = (matchers: ReturnType<typeof compile>, pathname: string) =>
  matchers.some((matcher) => {
    const result = matcher(pathname);

    return !!result && (result.params.locale === undefined || isKnownLocale(result.params.locale));
  });

/** The locale prefix the request came in with, so the redirect keeps it. */
const localePrefixOf = (pathname: string): string => {
  const segment = pathname.split('/')[1];

  return isKnownLocale(segment) ? `/${segment}` : '';
};

/*
 * A server action is a POST the browser resolves itself; a redirect returned
 * to one is swallowed rather than followed, and the submission is lost with
 * it. Guards let those through and let the action's own result answer.
 */
const isServerAction = (request: NextRequest): boolean => request.headers.get('next-action') !== null;

/**
 * The redirects step of the middleware chain: the route guards.
 *
 * Returns the redirect a request needs, or `null` when the request may carry
 * on to internationalisation.
 */
export const redirects = (request: NextRequest, session: SessionData | null): NextResponse | null => {
  if (isServerAction(request)) {
    return null;
  }

  const { pathname, search } = request.nextUrl;
  /*
   * Guest-typed sessions exist in the API's model and are carried here, but
   * they are not admitted to the member area — the guards treat one exactly as
   * they treat no session at all.
   */
  const signedIn = session?.user.type === 'USER';

  if (!signedIn && matches(protectedRoutes, pathname)) {
    const url = request.nextUrl.clone();

    url.pathname = `${localePrefixOf(pathname)}${ROUTES.SIGN_IN}`;
    url.search = '';
    url.searchParams.set(REDIRECT_QUERY_PARAM, `${pathname}${search}`);

    return NextResponse.redirect(url);
  }

  if (signedIn && matches(authRoutes, pathname)) {
    const url = request.nextUrl.clone();

    url.pathname = `${localePrefixOf(pathname)}${ROUTES.MEMBER.DASHBOARD}`;
    url.search = '';

    return NextResponse.redirect(url);
  }

  return null;
};
