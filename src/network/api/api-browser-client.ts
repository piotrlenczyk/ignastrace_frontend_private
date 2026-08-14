'use client';

import createClient, { type Middleware } from 'openapi-fetch';
import createQueryClient from 'openapi-react-query';

import { type paths } from './api';
import { API_PROXY_BASE_PATH } from './api-proxy-path';
import { QUERY_SERIALIZER } from './api-query-serializer';

/*
 * The browser's typed way onto the new API: the same generated specification the
 * server client uses, pointed at this application's own origin, where the proxy
 * route handler answers and attaches the bearer.
 *
 * A page script therefore holds no credential and states no base URL — it names
 * a path out of the specification and the types follow: request body, response
 * and declared errors all come from the generated `paths`, so a wrong field is a
 * build failure rather than a 400 in production.
 */

/*
 * The base URL is the proxy's mount and nothing more, so a path from the
 * specification goes out as it is written under `/api-proxy` and resolves
 * against the current origin. The handler strips that prefix and forwards the
 * rest verbatim, so `/api/v1/support/contact-us` here is the same path there.
 * Naming the origin would only make the client wrong behind a preview
 * deployment or a tunnel.
 */
const browserClient = createClient<paths>({ querySerializer: QUERY_SERIALIZER, baseUrl: API_PROXY_BASE_PATH });

/**
 * The locale, stated by the browser because the server cannot state it here.
 *
 * The server client asks next-intl for the locale, but inside a route handler
 * that getter has no request scope to read and falls back to English — which
 * would make every browser call English whatever page it came from. The document
 * language is the same value the layout rendered, so the browser sends it and
 * the proxy forwards it.
 */
const localeMiddleware: Middleware = {
  onRequest({ request }) {
    if (!request.headers.has('x-locale')) {
      const locale = document.documentElement.lang;

      if (locale) {
        request.headers.set('x-locale', locale);
      }
    }

    return request;
  },
};

browserClient.use(localeMiddleware);

/**
 * The query hooks every browser call goes through: `useQuery`, `useMutation` and
 * the rest, generic over the generated specification.
 *
 * A failure arrives at `onError` as the error body the specification declares
 * for that operation, not as `HttpClientError`. That is deliberate — the point
 * of these hooks is a call typed end to end, and the flattened envelope the
 * server-side layer throws would trade the operation's own error type for one
 * shared shape. Nor is there a handler here for 401: a dead session means
 * different things on a public form and behind the member area, so each call
 * site decides.
 */
export const apiQueries = createQueryClient(browserClient);
