import type { NextFetchEvent, NextRequest } from 'next/server';

import handleAuthAndIntl from './middlewares/auth-intl.middleware';
import { handleCaseNormalization } from './middlewares/case-normalization.middleware';
import { handleTracking } from './middlewares/tracking.middleware';

export default async function middleware(
  request: NextRequest,
  _event: NextFetchEvent,
) {
  if (request.nextUrl.pathname === '/health') {
    return new Response(null, { status: 200 });
  }

  const caseNormalizationResponse = handleCaseNormalization(request);

  if (caseNormalizationResponse) {
    return caseNormalizationResponse;
  }

  const response = await handleAuthAndIntl(request);

  const trackedResponse = handleTracking(request, response);

  trackedResponse.headers.set('x-pathname', request.nextUrl.pathname);

  return trackedResponse;
}

export const config = {
  matcher: ['/((?!_next|.*\\..*|api/).*)', '/'],
};
