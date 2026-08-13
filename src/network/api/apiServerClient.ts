import createClient, {
  wrapAsPathBasedClient,
  type Middleware,
} from 'openapi-fetch';


import { type components, type paths } from './api';
import { getIP } from '@/server/lib/ip';

const { getLocale } = await import('next-intl/server');

export type schemas = components['schemas'];
export type ResumeLanguage = schemas['ISO6391LanguageCode'];

// Base client configuration
const baseClientConfig = {
  baseUrl: process.env.API_BASE_URL,
  headers: {
    // 'x-api-key': env.API_KEY ?? '',
  },
  querySerializer: {
    array: {
      style: 'form' as const,
      explode: false,
    },
  },
};

// Create base client
export const _client = createClient<paths>(baseClientConfig);

// Server-side middleware that can access locale
const serverMiddleware: Middleware = {
  async onRequest({ request }) {
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

