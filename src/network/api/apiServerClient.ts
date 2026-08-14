import createClient, { type Middleware, wrapAsPathBasedClient } from 'openapi-fetch';

import { getIP } from '@/server/lib/ip';
import { getSession } from '@/server/session/session.server';

import { type components, type paths } from './api';
import { QUERY_SERIALIZER } from './api-query-serializer';

const { getLocale } = await import('next-intl/server');

export type schemas = components['schemas'];
export type ResumeLanguage = schemas['ISO6391LanguageCode'];

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

// Server-side middleware that can access locale
const serverMiddleware: Middleware = {
  async onRequest({ request }) {
    /*
     * The session's token, attached so that no call site can forget it. A
     * caller that set the header itself keeps it: the flows that exchange one
     * token for another have to be able to send something other than the
     * session's.
     */
    if (!request.headers.has('Authorization')) {
      const session = await getSession();

      if (session) {
        request.headers.set('Authorization', `Bearer ${session.accessToken}`);
      }
    }

    const ip = await getIP();
    if (ip) {
      request.headers.set('x-forwarded-for', ip);
    }

    if (request.headers.get('x-locale')) {
      return request;
    }

    // Add locale header from server context
    try {
      const locale = await getLocale();
      request.headers.set('x-locale', locale);
    } catch {
      // Fallback to default locale if server context is not available
      request.headers.set('x-locale', 'en');
    }

    return request;
  },
};

_client.use(serverMiddleware);

export const apiServerClient = wrapAsPathBasedClient(_client);
