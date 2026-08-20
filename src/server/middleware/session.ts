import { sealData, unsealData } from 'iron-session';
import type { NextRequest, NextResponse } from 'next/server';

import { apiServerClient } from '@/network/api/apiServerClient';
import { unwrapApiResponse } from '@/network/http-response-handler';
import { carryPaymentsCredential, withPaymentsCredential } from '@/server/session/payments-credential';
import {
  getSessionOptions,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  SESSION_TTL_SECONDS,
} from '@/server/session/session.constants';
import type { SessionData } from '@/server/session/session.types';
import { createSessionObject, isUsableSession } from '@/server/session/session.utils';
import { SiteConfig } from '@/utils/config';

export type SessionStep = {
  /** The session the rest of the chain decides on: the renewed one, or none. */
  session: SessionData | null;
  /**
   * Repeats on the outgoing response whatever the step did to the request's
   * cookies. Nothing, in the common case where the token was still good.
   */
  applyToResponse: (response: NextResponse) => void;
};

const LEAVE_RESPONSE_ALONE = () => {};

/*
 * This step seals and unseals by hand rather than going through
 * `getIronSession` the way the rest of the application does.
 *
 * Reading could go either way — Next does give the middleware a request scope,
 * so `cookies()` resolves here. Writing cannot: Next flushes a cookie written
 * through `cookies()` in the middleware with `headers.set('set-cookie', …)`,
 * which would drop the cookies the tracking step puts on the same response.
 * A renewed session also has to land on the *request* as well, because the
 * internationalisation step builds its response out of this request and would
 * otherwise serve the token that just expired.
 */
const readSession = async (cookies: NextRequest['cookies']): Promise<SessionData | null> => {
  const sealed = cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sealed) {
    return null;
  }

  // Read outside the catch: a missing password is a misconfigured deployment,
  // not a visitor without a session, and must not be swallowed as one.
  const { password } = getSessionOptions();

  try {
    const session = await unsealData<SessionData>(sealed, { password, ttl: SESSION_TTL_SECONDS });

    return isUsableSession(session) ? session : null;
  } catch {
    // A seal from a rotated password or a truncated cookie: no session.
    return null;
  }
};

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

/**
 * Exchanges the session's refresh token for a fresh pair. Raises when the
 * refresh token is spent or rejected, which is the signal to stop treating the
 * visitor as signed in.
 *
 * Three headers are stated rather than left to the client. The bearer is the
 * session's *expired* access token, because the operation declares bearer or
 * API-key authentication and this application configures no API key — so the
 * only credential it has to present is the one that just ran out. The locale and
 * the caller's address are stated because this runs before internationalisation
 * has settled a locale, and `getIP` needs a scope the client cannot reach from
 * here.
 */
const requestTokenRefresh = async (request: NextRequest, session: SessionData) => {
  const forwardedFor = forwardedForOf(request);

  return await apiServerClient['/api/v1/auth/refresh-token']
    .POST({
      body: { refreshToken: session.refreshToken },
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'x-locale': localeOf(request),
        ...(forwardedFor ? { 'x-forwarded-for': forwardedFor } : {}),
      },
    })
    .then(unwrapApiResponse);
};

/**
 * The session step of the middleware chain.
 *
 * Unseals the session the request arrived with and, when its access token has
 * run out, exchanges the refresh token for a new pair before the request is
 * served — so a member working inside the app is never interrupted by an
 * expiry. A refusal is not a redirect: the cookie goes and the request carries
 * on anonymously, leaving the guards to decide what that means for the route.
 * Middleware redirects are swallowed by server actions, which is why the
 * decision belongs to the redirects step and not to this one.
 *
 * Concurrent renewals are knowingly unguarded: the refresh token rotates, so
 * two requests arriving together can invalidate each other and sign the member
 * out. Deduplicating them is out of scope for now (see issue #16).
 *
 * The second, independent branch keeps the *payments* credential alive — a token
 * pair belonging to one technical account on the other upstream, which that
 * upstream is currently the only thing that will authenticate a member. It is
 * temporary and it is a deletion, not an untangling: this branch and the module
 * behind it go together. Both pairs are sealed once, into the one cookie.
 */
export const session = async (request: NextRequest): Promise<SessionStep> => {
  const current = await readSession(request.cookies);

  if (!current) {
    return { session: null, applyToResponse: LEAVE_RESPONSE_ALONE };
  }

  let renewed = current;
  let hasChanged = false;

  if (Date.now() >= current.accessTokenExpiresAt) {
    try {
      const { token, refreshToken } = await requestTokenRefresh(request, current);

      renewed = carryPaymentsCredential(current, createSessionObject({ access: token, refresh: refreshToken }));
      hasChanged = true;
    } catch {
      request.cookies.delete(SESSION_COOKIE_NAME);

      return {
        session: null,
        applyToResponse: (response) => response.cookies.delete(SESSION_COOKIE_NAME),
      };
    }
  }

  /*
   * Ordered after the API pair on purpose: a session that has just stopped
   * existing is not worth a foreign round trip. Nothing to do is answered with
   * nothing rather than with a copy, because the common case must not reseal the
   * cookie on every request.
   */
  const withCredential = await withPaymentsCredential(renewed);

  if (withCredential) {
    renewed = withCredential;
    hasChanged = true;
  }

  if (!hasChanged) {
    return { session: current, applyToResponse: LEAVE_RESPONSE_ALONE };
  }

  const sealed = await sealData(renewed, getSessionOptions());

  request.cookies.set(SESSION_COOKIE_NAME, sealed);

  return {
    session: renewed,
    applyToResponse: (response) => response.cookies.set(SESSION_COOKIE_NAME, sealed, SESSION_COOKIE_OPTIONS),
  };
};
