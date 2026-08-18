/**
 * Where the payments proxy is mounted in this application. The browser client
 * prefixes the specification's paths with it and the handler strips it back off,
 * so the two cannot drift apart.
 *
 * Its own module for the same reason the API's mount has one: the handler beside
 * it reaches for the session and the environment, so a page script importing it
 * for this one string would drag the server's half of the application into the
 * bundle.
 *
 * A mount of its own, rather than a branch under the API's, is what keeps the
 * two upstreams from being confused for one another — the specifications declare
 * unrelated paths (`/products` here, `/api/v1/...` there) and a single door would
 * have to guess which service a path belongs to.
 */
export const PAYMENTS_API_PROXY_BASE_PATH = '/payments-api-proxy';
