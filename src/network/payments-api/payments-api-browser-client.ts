'use client';

import createClient from 'openapi-fetch';
import createQueryClient from 'openapi-react-query';

import { type paths } from './payments-api';
import { PAYMENTS_API_PROXY_BASE_PATH } from './payments-api-proxy-path';

/*
 * The browser's typed way onto the Payments API: the same generated
 * specification the payments server client uses, pointed at this application's
 * own origin, where the payments proxy answers and attaches the session's token
 * as the cookie that service authenticates with.
 *
 * A page script therefore holds no credential and states no host — it names a
 * path out of the specification and the types follow: request body, response and
 * declared errors all come from the generated `paths`, so a wrong field is a
 * build failure rather than a 400 in production.
 *
 * A client of its own rather than a second base URL on the API's, because the
 * two specifications are unrelated: `/products` here and `/api/v1/...` there
 * name different services, and one client generic over both would let a call
 * site reach for a path the upstream it is talking to does not publish. Keeping
 * them apart also keeps each specification out of the other's bundle.
 */

/*
 * The base URL is the proxy's mount and nothing more, so a path from the
 * specification goes out as it is written under `/payments-api-proxy` and
 * resolves against the current origin. The handler strips that prefix and
 * forwards the rest verbatim, so `/products` here is the same path there.
 * Naming the origin would only make the client wrong behind a preview
 * deployment or a tunnel.
 *
 * No query serialiser, for the reason the payments server client gives: the one
 * array parameter this service publishes states no `style` or `explode`, which
 * is the OpenAPI default — repeated keys — and that is what this client writes
 * by default too. The API client overrides it because its specification asks for
 * the other convention.
 *
 * No locale middleware either, though not because this service is indifferent to
 * language. The API's browser client sets an `x-locale` header because the API's
 * server client asks next-intl for a locale and cannot inside a route handler.
 * The payments specification declares no such header. Where it does want a
 * locale it asks for one *in the operation*: `locale` is a required query
 * parameter of `GET /subscriptions/adyen/paymentMethods`, and a body field of an
 * Adyen payment. Those the generated types oblige the call site to state, and a
 * middleware could only guess at them — overriding an argument the caller passed
 * explicitly, or inventing one the compiler already demanded. So the locale
 * travels as the specification's own parameter, from the call site that knows
 * which payment it is describing, and this client adds nothing to it.
 */
const paymentsBrowserClient = createClient<paths>({ baseUrl: PAYMENTS_API_PROXY_BASE_PATH });

/**
 * The query hooks every browser call onto the Payments API goes through:
 * `useQuery`, `useMutation` and the rest, generic over the generated payments
 * specification.
 *
 * A failure arrives at `onError` as the body the service refused with — a
 * message and the status restated — not as `HttpClientError`. That is the same
 * bargain the API's hooks make: the point of these hooks is a call typed end to
 * end, and the flattened envelope the server-side layer throws would trade the
 * operation's own error type for one shared shape. A refusal that has to be read
 * as that shared envelope reaches a form through a server action, where
 * `PaymentsApiErrorParser` has already put it in one.
 *
 * Nor is there a handler here for 401: an unauthenticated caller is a normal
 * case for this service — public pricing is read before anybody has an account —
 * so what a dead session means is the call site's to decide.
 */
export const $paymentsApi = createQueryClient(paymentsBrowserClient);
