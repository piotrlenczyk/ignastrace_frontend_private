import type { NextFetchEvent, NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { API_PROXY_BASE_PATH } from './network/api/api-proxy-path';
import { PAYMENTS_API_PROXY_BASE_PATH } from './network/payments-api/payments-api-proxy-path';
import { caseNormalization } from './server/middleware/case-normalization';
import { intl } from './server/middleware/intl';
import { redirects } from './server/middleware/redirects';
import { session } from './server/middleware/session';
import { tracking } from './server/middleware/tracking';

/** Answered before anything else, so a probe never waits on the API. */
const HEALTH_PATH = '/health';

/*
 * Where this application serves route handlers rather than pages: its own
 * endpoints under `/api`, and the browser's doors onto the two upstreams, each
 * mounted beside them rather than under them.
 *
 * A door added here has to be added to this list too. It is not optional: a
 * mount left off takes the page chain, and the locale step rewrites the JSON
 * response its caller is waiting for into a navigation.
 */
const ROUTE_HANDLER_PREFIXES = ['/api/', `${API_PROXY_BASE_PATH}/`, `${PAYMENTS_API_PROXY_BASE_PATH}/`];

/*
 * Route handlers take the session step and nothing else. They need the renewed
 * token as much as a page does, but a guard redirect or a locale rewrite would
 * replace the response their caller is waiting for with a navigation.
 */
const isRouteHandler = (request: NextRequest): boolean =>
  ROUTE_HANDLER_PREFIXES.some((prefix) => request.nextUrl.pathname.startsWith(prefix));

/**
 * The chain, in order: case normalisation → session → redirects →
 * internationalisation → tracking. Each step is named for what it is and lives
 * in its own module under `server/middleware`, so a redirect can be traced back
 * to the step that produced it.
 *
 * The session step hands back the session it settled on together with a
 * callback to apply to the outgoing response. That shape is what lets the guard
 * see a renewed session while the renewed cookie still lands on the redirect the
 * guard produces.
 */
export default async function middleware(request: NextRequest, _event: NextFetchEvent) {
  if (request.nextUrl.pathname === HEALTH_PATH) {
    return new Response(null, { status: 200 });
  }

  if (isRouteHandler(request)) {
    const { applyToResponse } = await session(request);
    const response = NextResponse.next({ request });

    applyToResponse(response);

    return response;
  }

  const normalizedCase = caseNormalization(request);

  if (normalizedCase) {
    return normalizedCase;
  }

  const { session: currentSession, applyToResponse } = await session(request);

  /*
   * A guarded request never reaches internationalisation: the guard's redirect
   * is the response, and the locale step would only rewrite a URL nobody is
   * going to be served.
   */
  const guardRedirect = redirects(request, currentSession);
  let response: NextResponse;

  if (guardRedirect) {
    response = guardRedirect;
  } else {
    response = intl(request);
  }

  applyToResponse(response);

  const trackedResponse = tracking(request, response);

  trackedResponse.headers.set('x-pathname', request.nextUrl.pathname);

  return trackedResponse;
}

/*
 * Route handlers are matched too, so that a server-side endpoint is never the
 * one place still holding a token the session step would have renewed.
 */
export const config = {
  matcher: ['/((?!_next|.*\\..*).*)', '/'],
};
