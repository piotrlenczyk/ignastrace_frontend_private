import type { HttpClientErrorData } from '../http-client-error';
import { API_PATH_TEMPLATES } from './api-paths';
import { _client } from './apiServerClient';

/*
 * The browser's way onto the new API: a call a page script makes arrives here
 * and is forwarded with the bearer attached server-side, so the script itself
 * needs no credential.
 *
 * One of two such doors: `network/legacy/legacy-proxy.ts` is the same idea onto
 * the legacy backend. Between them nothing in the browser needs a bearer any
 * more, which is what allowed the readable access-token cookie ADR 0008
 * described to be deleted.
 *
 * The upstream path is mounted verbatim — `/api/v1/user/me` here is
 * `/api/v1/user/me` there — so a path literal out of the generated
 * specification is valid on both sides of the hop and the generated request,
 * response and error types apply end to end.
 *
 * What the proxy is: a door onto our API. Not a tunnel onto its host, and not a
 * way to present a token of one's own choosing. Hence the allow-lists below,
 * all four of them deliberately closed rather than open.
 */

/**
 * The API's authentication prefix. Minting, refreshing and revoking a session
 * belong to the session module, which talks to the API from the server; a page
 * script has no business reaching them, so the whole subtree is refused.
 */
const AUTH_PATH_PREFIX = '/api/v1/auth';

/**
 * The only request headers the browser gets to influence. Everything else the
 * API is sent — the bearer, the caller's address, the locale when the browser
 * did not state one — is attached by the server client's middleware.
 *
 * `authorization` is absent on purpose. Discarding it is what makes the
 * session's token the only one that can be presented, and the middleware
 * attaches that one precisely because it finds no header already set.
 */
const FORWARDED_REQUEST_HEADERS = ['x-locale', 'content-type', 'accept'] as const;

/**
 * The only response headers that reach the browser. `Set-Cookie` is the reason
 * this is a list and not a filter: the backend must not be able to write a
 * cookie into this application's origin.
 */
const RETURNED_RESPONSE_HEADERS = ['content-type'] as const;

/** The methods the proxy serves. The specification declares no others. */
type ProxyMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

const escapeLiteral = (literal: string): string => literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/*
 * Compiled once, at module load, rather than per request: the list is fixed at
 * build time, so recompiling forty-four regular expressions on every call would
 * be work with no possible new outcome.
 *
 * A `{param}` placeholder matches one segment and no slash, so
 * `/api/v1/admin/users/{id}` covers `/api/v1/admin/users/7` and not
 * `/api/v1/admin/users/7/sessions`.
 */
const PATH_MATCHERS = API_PATH_TEMPLATES.map(
  (template) =>
    new RegExp(
      `^${template
        .split(/\{[^{}]+\}/)
        .map(escapeLiteral)
        .join('[^/]+')}$`,
    ),
);

const isPublishedPath = (pathname: string): boolean => PATH_MATCHERS.some((matcher) => matcher.test(pathname));

const pickHeaders = (headers: Headers, allowed: readonly string[]): Headers => {
  const picked = new Headers();

  for (const name of allowed) {
    const value = headers.get(name);

    if (value !== null) {
      picked.set(name, value);
    }
  }

  return picked;
};

/**
 * A refusal by the proxy, written in the API's own error envelope so that the
 * browser reads it through the same parser as a refusal by the API itself.
 *
 * The envelope is named rather than spelled out positionally: `code` and
 * `errorCode` are both strings and sit next to each other, so a swap between
 * them is a mistake no type could catch.
 */
const refuse = (status: number, error: HttpClientErrorData): Response => Response.json({ error }, { status });

/*
 * The one cast in this module, and the reason it is needed: the client's
 * request method is generic over the specification's literal path types, while
 * the proxy's path is a string that only exists at run time. The matchers above
 * are what stands in for the check the type system cannot make here.
 *
 * Nothing else is loosened. `parseAs: 'stream'` leaves the success body
 * untouched, so a PDF or the Prometheus metrics text passes through as the
 * bytes the API sent rather than as something re-encoded on the way.
 */
const requestUpstream = _client.request as (
  method: ProxyMethod,
  path: string,
  init: { body?: unknown; headers: Headers; parseAs: 'stream' },
) => Promise<{ data?: ReadableStream<Uint8Array> | null; error?: unknown; response: Response }>;

/**
 * The request's JSON body, or `undefined` when it carries none.
 *
 * JSON and nothing else: every operation the specification declares a body for
 * takes one, and the client serialises whatever it is given back to JSON. A
 * multipart upload would need its own way through here rather than a wider
 * `catch` — which is why a body that is not JSON is refused rather than
 * forwarded as something the API cannot read.
 */
const readJsonBody = async (request: Request): Promise<unknown> => {
  const body = await request.text();

  if (body === '') {
    return undefined;
  }

  // Annotated rather than cast: `JSON.parse` returns `any`, and the point here
  // is to stop that spreading, not to claim anything about what arrived.
  const parsed: unknown = JSON.parse(body);

  return parsed;
};

/*
 * What the client hands back on a refusal: the parsed envelope when the body
 * was JSON, the raw text when it was not. Either way the caller receives what
 * the API said, under the status the API said it with.
 *
 * A refusal is the one body that is re-serialised rather than passed through.
 * The client reads it as text before this code sees it — it does that whatever
 * `parseAs` says — so there is no stream left to forward. The fields survive;
 * the upstream whitespace does not.
 */
const refusalBody = (error: unknown): BodyInit | null => {
  if (error === undefined || error === null) {
    return null;
  }

  return typeof error === 'string' ? error : JSON.stringify(error);
};

const proxy =
  (method: ProxyMethod) =>
  async (request: Request): Promise<Response> => {
    const { pathname, search } = new URL(request.url);

    if (pathname.startsWith(AUTH_PATH_PREFIX)) {
      return refuse(403, {
        code: 'FORBIDDEN',
        errorCode: 'PROXY_PATH_FORBIDDEN',
        message: 'Authentication is handled by the session, not the API.',
      });
    }

    if (!isPublishedPath(pathname)) {
      return refuse(404, {
        code: 'NOT_FOUND',
        errorCode: 'PROXY_PATH_UNKNOWN',
        message: 'The API publishes no such path.',
      });
    }

    let body: unknown;

    try {
      body = await readJsonBody(request);
    } catch {
      return refuse(400, {
        code: 'BAD_REQUEST',
        errorCode: 'PROXY_BODY_MALFORMED',
        message: 'The request body is not valid JSON.',
      });
    }

    /*
     * The query string is appended to the path rather than handed over as
     * parameters, so it reaches the API exactly as the browser wrote it —
     * repeated keys and array parameters included, which a parse and a
     * re-serialise would quietly rewrite.
     */
    const { data, error, response } = await requestUpstream(method, `${pathname}${search}`, {
      body,
      headers: pickHeaders(request.headers, FORWARDED_REQUEST_HEADERS),
      parseAs: 'stream',
    });

    return new Response(response.ok ? (data ?? null) : refusalBody(error), {
      status: response.status,
      headers: pickHeaders(response.headers, RETURNED_RESPONSE_HEADERS),
    });
  };

export const GET = proxy('get');
export const POST = proxy('post');
export const PUT = proxy('put');
export const PATCH = proxy('patch');
export const DELETE = proxy('delete');
