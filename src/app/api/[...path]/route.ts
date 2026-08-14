/*
 * The browser's entry point to the new API, mounted at this application's own
 * `/api` so that the upstream path is served unchanged: a request to
 * `/api/v1/user/me` here is forwarded to `/api/v1/user/me` there.
 *
 * A catch-all only ever sees what no more specific route claimed, so the
 * handlers this application serves itself — `/api/logout`, `/api/generate-pdf`
 * — still take precedence, and a path the API does not publish is refused here
 * rather than forwarded.
 *
 * The handlers live in the network layer next to the client and the generated
 * specification; this file is the mount and nothing else.
 */
export { DELETE, GET, PATCH, POST, PUT } from '@/network/api/api-proxy';
