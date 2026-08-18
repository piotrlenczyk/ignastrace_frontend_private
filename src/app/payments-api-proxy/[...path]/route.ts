/*
 * The browser's entry point to the Payments API. Everything under
 * `/payments-api-proxy` is forwarded to the payments service with the mount
 * stripped back off, so the upstream path is served unchanged: a request to
 * `/payments-api-proxy/products` here is forwarded to `/products` there.
 *
 * The prefix is the browser client's business too — both sides read it from
 * `network/payments-api/payments-api-proxy-path.ts` rather than spelling it out
 * — and a path the payments service does not publish, or one in a back-office
 * family, is refused here rather than forwarded.
 *
 * The handlers live in the network layer next to the client and the generated
 * specification; this file is the mount and nothing else. It serves the three
 * methods the payments specification declares, so a `PATCH` or a `DELETE` is
 * answered by Next with a method-not-allowed rather than by this application.
 */
export { GET, POST, PUT } from '@/network/payments-api/payments-api-proxy';
