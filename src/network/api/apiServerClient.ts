import createClient, { type Middleware, wrapAsPathBasedClient } from 'openapi-fetch';

import { type components, type paths } from './api';
import { QUERY_SERIALIZER } from './api-query-serializer';

export type schemas = components['schemas'];
export type ResumeLanguage = schemas['ISO6391LanguageCode'];

/** The locale the API is told about when nothing else states one. */
const FALLBACK_LOCALE = 'en';

// Base client configuration
const baseClientConfig = {
  baseUrl: process.env.API_BASE_URL,
  headers: {
    // 'x-api-key': env.API_KEY ?? '',
  },
  querySerializer: QUERY_SERIALIZER,
};

// Create base client
export const _client = createClient<paths>(baseClientConfig);

/*
 * The three request-scoped values, each read behind a `try` and each imported
 * at the point of use rather than at the top of this module.
 *
 * That shape is what makes this client usable from the middleware runtime as
 * well as from a server component: there is no request scope there, so a caller
 * in the middleware states all three headers itself and none of the getters
 * below is ever reached. A static import would still have to resolve, and a
 * throw from one of them would still have to be survivable, so both are avoided
 * rather than relied upon.
 */
const sessionBearer = async (): Promise<string | null> => {
  try {
    const { getSession } = await import('@/server/session/session.server');
    const session = await getSession();

    return session ? `Bearer ${session.accessToken}` : null;
  } catch {
    return null;
  }
};

const callerAddress = async (): Promise<string | null> => {
  try {
    const { getIP } = await import('@/server/lib/ip');

    return (await getIP()) ?? null;
  } catch {
    return null;
  }
};

const requestLocale = async (): Promise<string> => {
  try {
    const { getLocale } = await import('next-intl/server');

    return await getLocale();
  } catch {
    return FALLBACK_LOCALE;
  }
};

/**
 * Everything the API is sent that no call site should have to remember: the
 * session's bearer, the caller's address and the locale being served.
 *
 * Every one of them is caller-wins. A header already on the request is left
 * exactly as it is — that is what lets the flows exchanging one token for
 * another present something other than the session's, and what lets a caller
 * without a request scope supply the locale and the address itself.
 */
const requestScopeMiddleware: Middleware = {
  async onRequest({ request }) {
    if (!request.headers.has('Authorization')) {
      const bearer = await sessionBearer();

      if (bearer) {
        request.headers.set('Authorization', bearer);
      }
    }

    if (!request.headers.has('x-forwarded-for')) {
      const address = await callerAddress();

      if (address) {
        request.headers.set('x-forwarded-for', address);
      }
    }

    if (!request.headers.has('x-locale')) {
      request.headers.set('x-locale', await requestLocale());
    }

    return request;
  },
};

_client.use(requestScopeMiddleware);

export const apiServerClient = wrapAsPathBasedClient(_client);
