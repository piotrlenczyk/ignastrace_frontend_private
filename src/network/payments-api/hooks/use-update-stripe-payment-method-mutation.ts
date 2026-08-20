'use client';

import type { components } from '../payments-api';
import { $paymentsApi } from '../payments-api-browser-client';

/**
 * What the payments service answers a card change with: the subscription's
 * status, and — when the charge it attempts immediately needs the cardholder
 * present — a client secret to confirm and the payment intent it belongs to.
 */
export type StripeSubscriptionPaymentUpdate = components['schemas']['CreateStripeSubscriptionResponseDto'];

/**
 * Changes the card on the caller's subscription, as the payments service holds
 * it. The operation takes no subscription identifier: it acts on whichever
 * subscription that service has for the session behind the proxy's cookie.
 *
 * A mutation rather than a server action because a card change sets no cookie,
 * causes no navigation and changes nothing this application renders on the
 * server — the dialog it is raised from closes on its own callback. This is the
 * first production call site of the payments query hooks.
 *
 * The legacy predecessor answered `{ success: boolean }`, so its caller had to
 * read a refusal out of a body that arrived with a 200. Here a refusal is a
 * refusal: the hook rejects, and what reaches `onError` is the body the payments
 * service refused with rather than a fabricated `Error`.
 *
 * That body is not typed, and cannot be: the specification declares this
 * operation's 201 and nothing else, so the generated error type is `null` while
 * a refusal plainly arrives at runtime. A caller therefore has to treat what it
 * catches as unknown — narrowing against the generated type would assert the
 * refusal away. The flattened envelope with `source: 'payments-api'` is not what
 * arrives here either; that is the server-action path, per the note on
 * `$paymentsApi` itself.
 *
 * The response is returned whole rather than reduced to a boolean, because the
 * charge this endpoint attempts immediately may need a 3-D Secure confirmation —
 * `clientSecret` is how the caller learns that, and dropping it would silently
 * turn a card change awaiting the cardholder into a card change reported as done.
 */
export const useUpdateStripePaymentMethodMutation = () =>
  $paymentsApi.useMutation('post', '/subscriptions/stripe/payment-method');
