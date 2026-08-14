import type { NextFetchEvent, NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { handleCaseNormalization } from './middlewares/case-normalization.middleware';
import { handleIntl } from './middlewares/intl.middleware';
import { handleRedirects } from './middlewares/redirects.middleware';
import { handleSession } from './middlewares/session.middleware';
import { handleTracking } from './middlewares/tracking.middleware';

/*
 * Where this application serves route handlers rather than pages: its own
 * endpoints under `/api`, and the browser's door onto the new API, which is
 * mounted beside them rather than under them.
 */
const ROUTE_HANDLER_PREFIXES = ['/api/', '/api-proxy/'];

/*
 * Route handlers take the session step and nothing else. They need the renewed
 * token as much as a page does, but a guard redirect or a locale rewrite would
 * replace the response their caller is waiting for with a navigation.
 */
const isRouteHandler = (request: NextRequest): boolean =>
  ROUTE_HANDLER_PREFIXES.some((prefix) => request.nextUrl.pathname.startsWith(prefix));

/*
 * The chain, in order: case normalisation → session → redirects →
 * internationalisation → tracking. Each step is named and lives in its own
 * module, so a redirect can be traced back to the step that produced it.
 */
export default async function middleware(request: NextRequest, _event: NextFetchEvent) {
  if (request.nextUrl.pathname === '/health') {
    return new Response(null, { status: 200 });
  }

  if (isRouteHandler(request)) {
    const { applyToResponse } = await handleSession(request);
    const response = NextResponse.next({ request });

    await applyToResponse(response);

    return response;
  }

  const caseNormalizationResponse = handleCaseNormalization(request);

  if (caseNormalizationResponse) {
    return caseNormalizationResponse;
  }

  const { session, applyToResponse } = await handleSession(request);

  const response = handleRedirects(request, session) ?? handleIntl(request);

  await applyToResponse(response);

  const trackedResponse = handleTracking(request, response);

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
