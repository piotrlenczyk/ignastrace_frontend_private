/**
 * Where the legacy proxy is mounted in this application. The browser client
 * prefixes its endpoints with it and the handler strips it back off, so the two
 * cannot drift apart.
 *
 * It has its own module deliberately: the handler beside it reaches for the
 * session and the environment, so a page script importing it for this one
 * string would drag the server's half of the application into the bundle.
 */
export const LEGACY_PROXY_BASE_PATH = '/api/legacy';
