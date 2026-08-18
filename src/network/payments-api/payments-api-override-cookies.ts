/**
 * The prefix that marks a cookie in this application's origin as one the
 * payments service is meant to read.
 *
 * The service honours a small set of cookies that pin the payment provider, the
 * trial length and the split-payment and PayPal settings, and it knows them by
 * their bare names. Carrying the prefix in the browser is what keeps them from
 * colliding with this application's own cookies and what makes the selection
 * below a rule rather than a list to maintain.
 */
export const PAYMENTS_OVERRIDE_COOKIE_PREFIX = 'payments_';

/**
 * The name of the cookie the Payments API authenticates a member with.
 *
 * The service takes no user bearer: its specification declares an `access-token`
 * cookie for everything user-facing, and reserves its bearer schemes for Okta
 * and for bot automation. So this is not a stylistic difference from the API —
 * the header the other upstream reads is not read here at all.
 *
 * It lives beside the selection rule below because the rule has to refuse it.
 */
export const ACCESS_TOKEN_COOKIE = 'access-token';

/**
 * The override cookies among the browser's, written as the upstream `Cookie`
 * header wants them: the prefix taken off, everything else left where it is.
 *
 * A cookie named exactly as the bare prefix names nothing upstream, so it is
 * dropped rather than sent as `=value`.
 *
 * A cookie that would strip to the credential's name is dropped too, and that is
 * the one exception to the prefix being the whole rule. These overrides are
 * settable from the browser by design, so without the exception
 * `payments_access-token` would let a page script name the very credential the
 * proxy exists to keep out of its hands — and for a caller with no session, it
 * would be the only credential the service saw.
 *
 * The value is written back percent-encoded because the cookie store decoded it
 * on the way in. Restoring the encoding keeps one override one cookie: a value
 * carrying a `;` would otherwise arrive upstream as two.
 *
 * Selection lives here, apart from the client, so the QA widget that sets these
 * cookies can be added later as UI alone.
 */
export const upstreamOverrideCookies = (browserCookies: readonly { name: string; value: string }[]): string[] =>
  browserCookies
    .filter(({ name }) => name.startsWith(PAYMENTS_OVERRIDE_COOKIE_PREFIX))
    .map(({ name, value }) => ({ name: name.slice(PAYMENTS_OVERRIDE_COOKIE_PREFIX.length), value }))
    .filter(({ name }) => name !== '' && name !== ACCESS_TOKEN_COOKIE)
    .map(({ name, value }) => `${name}=${encodeURIComponent(value)}`);
