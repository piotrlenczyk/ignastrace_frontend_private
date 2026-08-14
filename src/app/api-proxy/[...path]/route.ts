/*
 * The browser's entry point to the new API. Everything under `/api-proxy` is
 * forwarded to the API with the mount stripped back off, so the upstream path
 * is served unchanged: a request to `/api-proxy/api/v1/user/me` here is
 * forwarded to `/api/v1/user/me` there.
 *
 * The prefix is the browser client's business too — both sides read it from
 * `network/api/api-proxy-path.ts` rather than spelling it out — and a path the
 * API does not publish is refused here rather than forwarded.
 *
 * The handlers live in the network layer next to the client and the generated
 * specification; this file is the mount and nothing else.
 */
export { DELETE, GET, PATCH, POST, PUT } from '@/network/api/api-proxy';
