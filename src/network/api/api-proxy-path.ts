/**
 * Where the API proxy is mounted in this application. The browser client
 * prefixes the specification's paths with it and the handler strips it back
 * off, so the two cannot drift apart.
 *
 * It has its own module deliberately: the handler beside it reaches for the
 * session and the environment, so a page script importing it for this one
 * string would drag the server's half of the application into the bundle.
 */
export const API_PROXY_BASE_PATH = '/api-proxy';
