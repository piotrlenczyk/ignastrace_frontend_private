import createClient, { type Middleware, wrapAsPathBasedClient } from 'openapi-fetch';

import { type components, type paths } from './payments-api';
import { ACCESS_TOKEN_COOKIE, upstreamOverrideCookies } from './payments-api-override-cookies';

export type paymentsSchemas = components['schemas'];

/**
 * The two headers the payments service is told where the caller is by.
 *
 * It chooses prices and payment providers per market, so the market has to
 * arrive with the request. Both names are the ones the edge in front of this
 * application already uses — the service reads them under those names, and its
 * specification documents neither.
 *
 * The country one is exported because a caller that resolves the market itself
 * states it rather than letting the raw edge header through, and there should be
 * one spelling of the name.
 */
const CALLER_ADDRESS_HEADER = 'x-forwarded-for';
export const CALLER_COUNTRY_HEADER = 'cf-ipcountry';

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
 * The four request-scoped values, each read behind a `try` and each imported at
 * the point of use rather than at the top of this module, for the reason the API
 * client's getters give: there is no request scope in every runtime this client
 * can be reached from, and a static import would still have to resolve there.
 */
/*
 * The *payments* credential, not the session's API access token: this upstream
 * only recognises tokens it issued itself, and the pair that says who the member
 * is was issued by the other one. The middleware keeps this field filled from a
 * technical account; an unconfigured environment leaves it empty, which is the
 * same case as a caller with no session. TEMPORARY — see
 * docs/adr/0023-a-shared-technical-account-for-the-payments-upstream.md.
 */
const paymentsAccessToken = async (): Promise<string | null> => {
  try {
    const { getSession } = await import('@/server/session/session.utils');
    const session = await getSession();

    // An empty session is an object without an access token, never `null`.
    return session.paymentsAccessToken ?? null;
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

const callerCountry = async (): Promise<string | null> => {
  try {
    const { getIPCountry } = await import('@/server/lib/ip');

    return (await getIPCountry()) ?? null;
  } catch {
    return null;
  }
};

/*
 * Read server-side, out of the request's own cookie store, and never relayed
 * from a browser-supplied header: the proxy in front of this client discards a
 * `Cookie` the browser sent, precisely so that the credential cannot be chosen
 * by a page script. The overrides arrive here the same way the session does.
 */
const overrideCookies = async (): Promise<string[]> => {
  try {
    const { cookies } = await import('next/headers');

    return upstreamOverrideCookies((await cookies()).getAll());
  } catch {
    return [];
  }
};

/**
 * Everything the payments service is sent that no call site should have to
 * remember: the session's payments credential as the cookie it authenticates
 * with, the caller's address and country, and the QA override cookies repackaged
 * for it.
 *
 * The credential and the two context headers are caller-wins, as on the API
 * client. A header already on the request is left exactly as it is, so a flow
 * that must present something other than the session's credential still can, and
 * a caller without a request scope can state the context itself.
 *
 * A caller without a credential simply goes out without one, which is what lets
 * public pricing be read before anybody has an account — an unauthenticated call
 * is a normal case here, not a failure to be refused early.
 *
 * The overrides are the exception, and last on purpose: they are merged onto
 * whatever `Cookie` the request ends up with rather than substituted for it, so
 * pinning a provider never signs the caller out.
 */
const requestScopeMiddleware: Middleware = {
  async onRequest({ request }) {
    if (!request.headers.has('Cookie')) {
      const credential = await paymentsAccessToken();

      if (credential) {
        request.headers.set('Cookie', `${ACCESS_TOKEN_COOKIE}=${credential}`);
      }
    }

    if (!request.headers.has(CALLER_ADDRESS_HEADER)) {
      const address = await callerAddress();

      if (address) {
        request.headers.set(CALLER_ADDRESS_HEADER, address);
      }
    }

    if (!request.headers.has(CALLER_COUNTRY_HEADER)) {
      const country = await callerCountry();

      if (country) {
        request.headers.set(CALLER_COUNTRY_HEADER, country);
      }
    }

    const overrides = await overrideCookies();

    if (overrides.length > 0) {
      const stated = request.headers.get('Cookie');

      request.headers.set('Cookie', (stated ? [stated, ...overrides] : overrides).join('; '));
    }

    return request;
  },
};

_paymentsClient.use(requestScopeMiddleware);

/**
 * The Payments API as a server component or a server action reads it: typed from
 * the generated specification, reaching paths as the specification writes them.
 *
 * The other upstream is `network/api/apiServerClient.ts`. Neither client can
 * serve the other's paths — the types say so — which is the point of there being
 * two.
 */
export const paymentsApiServerClient = wrapAsPathBasedClient(_paymentsClient);
