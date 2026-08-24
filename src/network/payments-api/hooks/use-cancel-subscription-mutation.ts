'use client';

import { $paymentsApi } from '../payments-api-browser-client';

/**
 * Cancels the caller's subscription, as the payments service holds it. Like the
 * card change, the operation takes no subscription identifier: it acts on
 * whichever subscription that service has for the session behind the proxy's
 * cookie — which, while ADR 0023 stands, is one shared technical account's.
 *
 * A mutation rather than a server action because a cancellation sets no cookie
 * and causes no navigation. It does change what this application renders on the
 * server, so the call site follows it with `router.refresh()` rather than a query
 * key: the billing screen reads the subscription in a server component.
 *
 * The body is declared required and holds one optional field, `cancellationReason`
 * — free text, the member's own words. This screen's dialog asks for none, so the
 * request is an empty object and the field is omitted, which is what the
 * specification asks for when no reason was given. It is deliberately not used to
 * say *which* screen cancelled: that is the only channel the service offers for
 * the distinction, and a field for a member's words is the wrong place to put a
 * screen's name.
 *
 * The answer is `{ message: string }` — an acknowledgement, not a subscription —
 * so there is nothing here for the screen to render. What the member sees comes
 * from the refresh re-reading the same upstream this call just wrote to.
 *
 * A refusal arrives as the body the payments service refused with, untyped for
 * the reason the card change gives: the specification declares this operation's
 * 200 and 201 and nothing else, so the generated error type is `null` while a
 * refusal plainly arrives.
 */
export const useCancelSubscriptionMutation = () => $paymentsApi.useMutation('post', '/subscriptions/cancel');
