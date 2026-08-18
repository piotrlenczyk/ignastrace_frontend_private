import createClient, { type Middleware, wrapAsPathBasedClient } from 'openapi-fetch';

import { type components, type paths } from './payments-api';

export type paymentsSchemas = components['schemas'];

/**
 * The name of the cookie the Payments API authenticates a member with.
 *
 * The service takes no user bearer: its specification declares an `access-token`
 * cookie for everything user-facing, and reserves its bearer schemes for Okta
 * and for bot automation. So this is not a stylistic difference from the API —
 * the header the other upstream reads is not read here at all.
 */
const ACCESS_TOKEN_COOKIE = 'access-token';

/*
 * The Payments API declares its paths bare — `/products`, `/subscriptions` — and
 * keeps the `/api/payments/v1` prefix in the specification's `servers` field, so
 * that prefix belongs in the environment variable's value rather than in code.
 * A path literal out of the generated specification is therefore usable exactly
 * as it is written.
 *
 * No query serialiser is configured, deliberately. The one array parameter the
 * service publishes states no `style` or `explode`, which is the OpenAPI default
 * — repeated keys — and that is what this client writes by default too. The API
 * client overrides it because its specification asks for the other convention;
 * copying that override here would send the payments service something it does
 * not read.
 */
export const _paymentsClient = createClient<paths>({ baseUrl: process.env.PAYMENTS_API_BASE_URL });

/*
 * Read behind a `try` and imported at the point of use rather than at the top of
 * this module, for the reason the API client's getters give: there is no request
 * scope in every runtime this client can be reached from, and a static import
 * would still have to resolve there.
 */
const sessionAccessToken = async (): Promise<string | null> => {
  try {
    const { getSession } = await import('@/server/session/session.utils');
    const session = await getSession();

    // An empty session is an object without an access token, never `null`.
    return session.accessToken ?? null;
  } catch {
    return null;
  }
};

/**
 * The credential no call site should have to remember: the session's access
 * token, presented as the cookie the payments service authenticates with.
 *
 * Caller-wins, as on the API client. A request that already states a `Cookie`
 * header is left exactly as it is, so a flow that must present something other
 * than the session's token still can.
 *
 * A caller without a session simply goes out without a cookie, which is what
 * lets public pricing be read before anybody has an account — an unauthenticated
 * call is a normal case here, not a failure to be refused early.
 */
const sessionCookieMiddleware: Middleware = {
  async onRequest({ request }) {
    if (!request.headers.has('Cookie')) {
      const accessToken = await sessionAccessToken();

      if (accessToken) {
        request.headers.set('Cookie', `${ACCESS_TOKEN_COOKIE}=${accessToken}`);
      }
    }

    return request;
  },
};

_paymentsClient.use(sessionCookieMiddleware);

/**
 * The Payments API as a server component or a server action reads it: typed from
 * the generated specification, reaching paths as the specification writes them.
 *
 * The other upstream is `network/api/apiServerClient.ts`. Neither client can
 * serve the other's paths — the types say so — which is the point of there being
 * two.
 */
export const paymentsApiServerClient = wrapAsPathBasedClient(_paymentsClient);
