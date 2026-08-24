'use client';

import { $paymentsApi } from '../payments-api-browser-client';

/**
 * Calls off a cancellation: resumes a subscription that was cancelled and has not
 * expired yet. No payment is taken — the member simply keeps the subscription they
 * already have.
 *
 * This is *not* the reactivation the glossary's first sense names. Buying a
 * subscription again after the previous one expired takes a payment and goes
 * through the checkout island; that act lives on the billing screen too, as
 * `ActivateSubscription`, and is untouched by this hook.
 *
 * The operation declares no body and no parameters. Which subscription it resumes
 * comes from the session behind the proxy's cookie — the same shared technical
 * account ADR 0023 describes, for as long as that record stands.
 *
 * The screen only offers this where `couldReactivate` holds — the subscription is
 * cancelled and `expiresAt` is still ahead — which is precisely the state this
 * endpoint resumes, so the gating needed no change when the call moved off legacy.
 *
 * The answer is `{ message: string }`, so the call site refreshes rather than
 * rendering it, and a refusal arrives as the body the service refused with,
 * untyped for the reason the card change gives.
 */
export const useReactivateSubscriptionMutation = () => $paymentsApi.useMutation('post', '/subscriptions/reactivate');
