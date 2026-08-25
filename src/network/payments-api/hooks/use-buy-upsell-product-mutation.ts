'use client';

import { $paymentsApi } from '../payments-api-browser-client';

/**
 * Buys one upsell product on the payments service, at the price row that was
 * quoted.
 *
 * The body is the price identifier and nothing else: the amount, the currency and
 * the provider all come off that row, so **the amount charged is the amount the
 * screen displayed** — which is the point of ADR 0030 and the end of the
 * divergence ADR 0029 accepted.
 *
 * The operation names no member, and cannot: while ADR 0023 stands the charge is
 * raised as the shared technical account behind the proxy's cookie, knowingly,
 * on the same reasoning that lets the checkout island charge subscriptions that
 * way. What connects the charge to the member is the backend's own listener,
 * which grants the credit; nothing here does.
 *
 * A mutation rather than a server action because a purchase sets no cookie and
 * causes no navigation. Where it does change server-rendered output the call site
 * refreshes deliberately, after the credit has been spent.
 *
 * The answer is `{ success, clientSecret?, transactionId? }`. A client secret
 * means the provider wants the cardholder present, so the response is returned
 * whole: reducing it to `success` would report a charge awaiting a 3-D Secure
 * challenge as a completed sale. `unlockUpsellWithCredit` is what reads it.
 */
export const useBuyUpsellProductMutation = () => $paymentsApi.useMutation('post', '/products/upsell/buy');
