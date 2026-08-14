import type { NextRequest, NextResponse } from 'next/server';

import {
  type ApiRequestContext,
  clearSession,
  isAccessTokenExpired,
  performRenewal,
  readSession,
  type SessionCookieWriter,
  writeSession,
} from '@/server/session/session';
import type { SessionData } from '@/server/session/session.types';
import { SiteConfig } from '@/utils/config';

export type SessionStep = {
  /** The session the rest of the chain decides on: the renewed one, or none. */
  session: SessionData | null;
  /**
   * Repeats on the outgoing response whatever the step did to the request's
   * cookies. Nothing, in the common case where the token was still good.
   */
  applyToResponse: (response: NextResponse) => Promise<void>;
};

const LEAVE_RESPONSE_ALONE = async () => {};

/*
 * A request's cookie jar carries names and values only, so the options a
 * response cookie takes are dropped here. Writing to it is still worth doing:
 * the internationalisation step builds its response out of this request, and
 * would otherwise build it from the token that just expired.
 */
const asWriter = (cookies: NextRequest['cookies']): SessionCookieWriter => ({
  get: (name) => cookies.get(name),
  set: (name, value) => cookies.set(name, value),
  delete: (name) => cookies.delete(name),
});

/*
 * The locale this request is being served in, for the API's `x-locale`. Read
 * off the URL and then the cookie next-intl stores its choice in, because the
 * step that resolves it properly runs after this one — and its resolver pulls
 * in client navigation, which this runtime does not have.
 */
const isEnabledLocale = (value: string | undefined): value is string =>
  !!value && (SiteConfig.locales as string[]).includes(value);

const localeOf = (request: NextRequest): string => {
  const [, segment] = request.nextUrl.pathname.split('/');
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;

  if (isEnabledLocale(segment)) {
    return segment;
  }

  return isEnabledLocale(cookieLocale) ? cookieLocale : SiteConfig.defaultLocale;
};

/*
 * The caller's IP, read the way `getIP` reads it — that helper needs a
 * request scope this runtime does not have, so the header comes off the
 * request directly instead.
 */
const forwardedForOf = (request: NextRequest): string | undefined =>
  request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();

const contextOf = (request: NextRequest): ApiRequestContext => ({
  locale: localeOf(request),
  forwardedFor: forwardedForOf(request),
});

/**
 * The session step of the middleware chain.
 *
 * Unseals the session the request arrived with and, when its access token has
 * run out, exchanges the refresh token for a new pair before the request is
 * served — so a member working inside the app is never interrupted by an
 * expiry. A refusal is not a redirect: both cookies go and the request carries
 * on anonymously, leaving the guards to decide what that means for the route.
 * Middleware redirects are swallowed by server actions, which is why the
 * decision belongs to the redirects step and not to this one.
 */
export const handleSession = async (request: NextRequest): Promise<SessionStep> => {
  const session = await readSession(request.cookies);

  if (!session || !isAccessTokenExpired(session)) {
    return { session, applyToResponse: LEAVE_RESPONSE_ALONE };
  }

  const renewed = await performRenewal(asWriter(request.cookies), session, contextOf(request));

  if (!renewed) {
    return {
      session: null,
      applyToResponse: async (response) => clearSession(response.cookies),
    };
  }

  return {
    session: renewed,
    applyToResponse: (response) => writeSession(response.cookies, renewed),
  };
};
