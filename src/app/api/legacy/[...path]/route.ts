/*
 * The browser's entry point to the legacy backend. Everything under
 * `/api/legacy` is forwarded to the one host that backend is deployed at, with
 * the session's bearer attached server-side — which is what lets the access
 * token stop being readable by page scripts.
 *
 * It sits under `/api/legacy` rather than at `/api`, where the new API's
 * catch-all already is; a more specific route wins over a catch-all, so the two
 * mounts do not compete.
 *
 * The handlers live in the network layer next to the client they serve; this
 * file is the mount and nothing else.
 */
export { DELETE, GET, PATCH, POST, PUT } from '@/network/legacy/legacy-proxy';
