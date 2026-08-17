import { pickHeaders } from '@/network/proxy-headers';
import { getSession } from '@/server/session/session.utils';

import { legacyApiUrl } from './legacy-api-url';
import { LEGACY_PROXY_BASE_PATH } from './legacy-proxy-path';

/*
 * The browser's way onto the legacy backend, and the reason the access token no
 * longer has to be readable by page scripts. A call a legacy hook makes arrives
 * here and is forwarded with the bearer attached server-side.
 *
 * It validates no path. There is no specification for that backend to check one
 * against, and inventing an allow-list from the twenty-nine hooks that call it
 * would be a list that goes stale the first time one of them changes. What
 * bounds this proxy is the single host it forwards to: it is a door onto the
 * legacy backend, not a tunnel onto an arbitrary one.
 *
 * A dot segment in the path can therefore reach a sibling path on that host —
 * which is the same access the browser already has, and nothing beyond it,
 * because the host is fixed here rather than taken from the request.
 */

/**
 * The only request headers the browser gets to influence. `authorization` is
 * absent on purpose: discarding it is what makes the session's token the only
 * one that can be presented.
 */
const FORWARDED_REQUEST_HEADERS = ['content-type', 'accept'] as const;

/** The methods the legacy client uses. */
type ProxyMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const proxy =
  (method: ProxyMethod) =>
  async (request: Request): Promise<Response> => {
    const { pathname, search } = new URL(request.url);
    const headers = pickHeaders(request.headers, FORWARDED_REQUEST_HEADERS);
    const session = await getSession();

    // An empty session is an object without an access token, never `null`.
    if (session.accessToken) {
      headers.set('authorization', `Bearer ${session.accessToken}`);
    }

    /*
     * Read rather than streamed through: the legacy client sends JSON and
     * nothing else, and a streamed request body needs a duplex negotiation that
     * buys nothing for a payload this size.
     */
    const body = await request.text();

    const upstream = await fetch(`${legacyApiUrl()}${pathname.slice(LEGACY_PROXY_BASE_PATH.length)}${search}`, {
      method,
      headers,
      body: body === '' ? undefined : body,
    });

    /*
     * Status and body, and no header at all. `Set-Cookie` is the reason: the
     * backend must not be able to write a cookie into this application's
     * origin. Nothing in the legacy client reads a response header.
     *
     * The body is passed on as the stream it arrived as, so an answer that may
     * carry none — a 204, say — is reconstructed as one that carries none.
     */
    return new Response(upstream.body, { status: upstream.status });
  };

export const GET = proxy('GET');
export const POST = proxy('POST');
export const PUT = proxy('PUT');
export const PATCH = proxy('PATCH');
export const DELETE = proxy('DELETE');
