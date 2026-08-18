import { pickHeaders } from '../proxy-headers';
import { PAYMENTS_API_PATH_TEMPLATES } from './payments-api-paths';
import { PAYMENTS_API_PROXY_BASE_PATH } from './payments-api-proxy-path';
import { _paymentsClient } from './payments-api-server-client';

/*
 * The browser's way onto the Payments API: a call a page script makes arrives
 * here and is forwarded with the session's token attached server-side, as the
 * cookie that service authenticates with, so the script itself needs no
 * credential and names no host.
 *
 * The third such door, and the same shape as `network/api/api-proxy.ts`: the
 * upstream path is mounted verbatim — `/products` here is `/products` there —
 * so a path literal out of the generated specification is valid on both sides
 * of the hop and the generated request, response and error types apply end to
 * end.
 *
 * Written out rather than shared with the API's proxy. The two differ in what
 * they refuse, in the envelope they refuse in, in the methods their
 * specifications declare and in the credential they attach; a factory over all
 * four would be a harder thing to read than either door, and generalising the
 * existing proxy is a change to the module this work was asked to leave alone.
 *
 * What the proxy is: a door onto our payments service. Not a tunnel onto its
 * host, and not a way to present a credential of one's own choosing. Hence the
 * lists below, all of them deliberately closed rather than open.
 */

/**
 * The path families this door is closed to, whatever the specification
 * publishes: the back office of the payments service.
 *
 * `admin` and `price-configurator` configure products, prices and routing;
 * `internal` and `bot` are for other services and for support automation;
 * `webhook` is where the payment providers post, authenticated by signature
 * rather than by session; `chargeback-expert` refunds by provider identifier.
 * None of them is a browser's business, and roughly half of the specification's
 * paths are one of them.
 *
 * Matched as a family rather than as a list of paths, which is the difference
 * from the API proxy's enumerated refusals: an endpoint added upstream in one of
 * these families is refused the day it appears, without waiting for anybody to
 * notice it in a regenerated allow-list. The family is compared against the
 * first segment as a prefix, so a rename that pluralises one — the chargeback
 * family is published as `chargeback-experts` today — stays refused.
 */
const REFUSED_PATH_FAMILIES: readonly string[] = [
  'admin',
  'internal',
  'bot',
  'webhook',
  'price-configurator',
  'chargeback-expert',
];

/**
 * The only request headers the browser gets to influence.
 *
 * `authorization` and `cookie` are both absent on purpose. Discarding them is
 * what makes the session's token the only credential that can be presented: the
 * client's middleware attaches it precisely because it finds no cookie already
 * set, so a browser that could send one would be choosing who it is.
 */
const FORWARDED_REQUEST_HEADERS = ['x-locale', 'content-type', 'accept'] as const;

/**
 * The only response headers that reach the browser. `Set-Cookie` is the reason
 * this is a list and not a filter: the payments service must not be able to
 * write a cookie into this application's origin — least of all the one it
 * authenticates with.
 */
const RETURNED_RESPONSE_HEADERS = ['content-type'] as const;

/** The methods the proxy serves. The specification declares no others. */
type ProxyMethod = 'get' | 'post' | 'put';

const escapeLiteral = (literal: string): string => literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/*
 * Compiled once, at module load, rather than per request: the list is fixed at
 * build time, so recompiling seventy regular expressions on every call would be
 * work with no possible new outcome.
 *
 * A `{param}` placeholder matches one segment and no slash, so
 * `/billing/transactions/{id}` covers `/billing/transactions/42` and not
 * `/billing/transactions/42/refunds`.
 */
const toMatcher = (template: string): RegExp =>
  new RegExp(
    `^${template
      .split(/\{[^{}]+\}/)
      .map(escapeLiteral)
      .join('[^/]+')}$`,
  );

const PATH_MATCHERS = PAYMENTS_API_PATH_TEMPLATES.map(toMatcher);

const isPublishedPath = (pathname: string): boolean => PATH_MATCHERS.some((matcher) => matcher.test(pathname));

const isRefusedPath = (pathname: string): boolean => {
  const [family] = pathname.split('/').slice(1);

  return family !== undefined && REFUSED_PATH_FAMILIES.some((refused) => family.startsWith(refused));
};

/**
 * A refusal by the proxy, written in the envelope the payments service itself
 * refuses in — a message and the status restated in the body, which is the
 * framework default that service runs on.
 *
 * Speaking the service's envelope rather than the API's is what lets a call site
 * read a refusal by the door through the same parser as a refusal by the service
 * behind it. The API's envelope would be read by the API's parser, which would
 * report a payments refusal as having come from the other upstream.
 *
 * `errorCode` is the one addition: the service publishes no codes, and a refusal
 * that never reached it is worth being able to tell apart from one that did.
 */
const refuse = (statusCode: number, errorCode: string, message: string): Response =>
  Response.json({ message, errorCode, statusCode }, { status: statusCode });

/*
 * The one cast in this module, and the reason it is needed: the client's request
 * method is generic over the specification's literal path types, while the
 * proxy's path is a string that only exists at run time. The matchers above are
 * what stands in for the check the type system cannot make here.
 *
 * Nothing else is loosened. `parseAs: 'stream'` leaves the success body
 * untouched, so what the service sent passes through as bytes rather than as
 * something re-encoded on the way.
 */
const requestUpstream = _paymentsClient.request as (
  method: ProxyMethod,
  path: string,
  init: { body?: unknown; headers: Headers; parseAs: 'stream' },
) => Promise<{ data?: ReadableStream<Uint8Array> | null; error?: unknown; response: Response }>;

/**
 * The request's JSON body, or `undefined` when it carries none.
 *
 * JSON and nothing else: every operation the specification declares a body for
 * takes one, and the client serialises whatever it is given back to JSON. A body
 * that is not JSON is refused rather than forwarded as something the service
 * cannot read.
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
 * What the client hands back on a refusal: the parsed envelope when the body was
 * JSON, the raw text when it was not. Either way the caller receives what the
 * service said, under the status the service said it with.
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
    const { pathname: mountedPath, search } = new URL(request.url);

    /*
     * The mount comes off and what is left is the payments service's own path,
     * unchanged: `/payments-api-proxy/products` here is `/products` there.
     * Stripping the prefix is the only rewriting that happens — the browser
     * client adds the same constant — so a specification path literal still
     * describes both sides of the hop.
     */
    const pathname = mountedPath.slice(PAYMENTS_API_PROXY_BASE_PATH.length);

    /*
     * The families are checked before the allow-list on purpose: a back-office
     * path is refused as forbidden whether or not the specification publishes it
     * today, so an endpoint added upstream in one of them is never briefly
     * reachable between a regeneration and somebody reading the list again.
     */
    if (isRefusedPath(pathname)) {
      return refuse(403, 'PROXY_PATH_FORBIDDEN', 'This path is not served to the browser.');
    }

    if (!isPublishedPath(pathname)) {
      return refuse(404, 'PROXY_PATH_UNKNOWN', 'The Payments API publishes no such path.');
    }

    let body: unknown;

    try {
      body = await readJsonBody(request);
    } catch {
      return refuse(400, 'PROXY_BODY_MALFORMED', 'The request body is not valid JSON.');
    }

    /*
     * The query string is appended to the path rather than handed over as
     * parameters, so it reaches the service exactly as the browser wrote it —
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
