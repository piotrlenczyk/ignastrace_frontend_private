import type { NextFetchEvent, NextRequest } from 'next/server';

import { handleCaseNormalization } from './middlewares/case-normalization.middleware';
import { handleIntl } from './middlewares/intl.middleware';
import { handleRedirects } from './middlewares/redirects.middleware';
import { handleSession } from './middlewares/session.middleware';
import { handleTracking } from './middlewares/tracking.middleware';

/*
 * The chain, in order: case normalisation → session → redirects →
 * internationalisation → tracking. Each step is named and lives in its own
 * module, so a redirect can be traced back to the step that produced it.
 */
export default async function middleware(request: NextRequest, _event: NextFetchEvent) {
  if (request.nextUrl.pathname === '/health') {
    return new Response(null, { status: 200 });
  }

  const caseNormalizationResponse = handleCaseNormalization(request);

  if (caseNormalizationResponse) {
    return caseNormalizationResponse;
  }

  const session = await handleSession(request);

  const response = handleRedirects(request, session) ?? handleIntl(request);

  const trackedResponse = handleTracking(request, response);

  trackedResponse.headers.set('x-pathname', request.nextUrl.pathname);

  return trackedResponse;
}

export const config = {
  matcher: ['/((?!_next|.*\\..*|api/).*)', '/'],
};
