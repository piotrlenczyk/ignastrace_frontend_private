# 0024 — The subscription read moves to payments before the data does

**Status:** Accepted — August 2026. Reverses one line of the legacy retirement track opened by
[0022](0022-retiring-the-legacy-layer-on-its-own-track.md): `GET /subscription` was listed there, and
in the track's epic (#69), as out of scope by choice. It is not out of scope any more; the read is on
the payments service, and the writes are not. It changes nothing in
[0023](0023-a-shared-technical-account-for-the-payments-upstream.md) about which credential that
service is called with, and it does not answer the question
[0021](0021-the-checkout-island-takes-every-payment-but-one.md) named and #73 closed — it acts in
spite of that answer, which is the whole of the trade recorded here.

## Context

**The billing screen was the last screen reading a subscription from the legacy backend.** It read
`GET /subscription` through the legacy server getter and rendered a shape only that backend publishes:
`current_period_start`, `current_period_end`, `cancel_at`, a six-value status enum with
`incomplete_expired` in it, and a price in the subscription row itself.

**The payments service models the same thing differently, and worse in three places.** Its
`SubscriptionResponseDto` has `createdAt`, `expiresAt`, an optional `cancelledAt` and an optional
`nextPaymentAttemptAt`; the price arrives through `product.price`; the status enum has five values,
because it has no `incomplete_expired`; and there is no current period at all — the only way to state
one is a second call to `/billing/transactions` for a transaction's `validFrom`/`validTo`, which is
what the reference integration in the resumewise frontend does. Against that, it publishes one thing
legacy does not: a subscription the service is still retrying payment on, reachable as `expired` plus
a `nextPaymentAttemptAt`. Legacy maps Stripe's `past_due` onto `active`, so dunning was invisible
there, and this screen consequently called a retrying subscription "Expired" and offered to sell it
again.

**Record ownership is settled, and the answer is no.** #73 asked whether the payments service observes
a subscription created through the legacy API. It does not, and the answer differs by population:
a member who subscribed through the phone-lookup checkout has a payments-side row, and a member who
subscribed through legacy has none. There is no backfill planned. That is why the four subscription
_writes_ (#75, #76, #77, #78) are blocked, and it was why the read was excluded too.

**And the credential is not the member's.** Record 0023 stands: every payments call is made as one
shared technical account, against a resumewise development instance, until an Ignastrace deployment
exists that trusts this application's tokens.

## Decision

**The billing screen reads the payments service, and only the payments service.** The legacy
`GET /subscription` call is gone from the application; the read is `getSubscription()`, which was
already written for the checkout and already computes the four facts a screen branches on —
`hasAccess`, `couldCancel`, `couldReactivate`, and a `calculatedStatus` that names the retrying state
`pending`.

**A member the service holds nothing for is sent home, exactly as before.** This is deliberately the
same branch the screen already had for a missing subscription, and it is now the common case rather
than the exceptional one: the entire legacy population reaches billing and is redirected off it. No
"we cannot find your subscription" state is invented, and no activation offer is shown in that branch —
an offer there would put a payment button in front of a paying member whose legacy subscription is
still charging, which is exactly the live defect #85 describes.

**The screen adopts the new shape with no adapter**, per 0022. `createdAt` states when the
subscription started; `expiresAt` states the next billing date, the active-until date and the
expiry date, because it is the only date the service publishes for any of them; `cancelledAt` renders
a row only when it arrives; `nextPaymentAttemptAt` renders a new row, for the state that had no name
before. The price comes from `product.price`, whose amount is in cents — which is what the existing
formatter already expects.

**The whole status vocabulary is badged, not three of it.** `initial`, `incomplete` and `pending` get
labels; the first two are unreachable through the settings layout's own guard, and are covered anyway
rather than left to render a badge-less card. `pending` keeps the member's access, so it is not offered
a price: it is told when the next attempt falls.

**The writes stay on legacy, and stop feeding the screen's state.** Cancellation and reactivation are
still `DELETE /subscription` and `PUT /subscription/reactivate`; #77 and #78 stay blocked. Their
responses are a legacy shape this screen no longer reads, so the client-held copy of the subscription
is deleted and both mutations end in `router.refresh()`. Whether the button in front of a member does
anything now depends on which population they are in, and the screen cannot tell them.

**The activation offer keeps this application's rule about trials.** It is shown for `expired` alone,
and resolves the non-trial product strictly. The reference integration is looser on both counts — it
offers the checkout whenever there is no access _or_ payment is pending, out of a plan picker that
defaults to the trial — and copying it would sell a trial to a member who has already had one.

## Alternatives rejected

**Waiting for the migration, as 0022 decided.** The correct order is data first, read second. Rejected
because the wait has no date: there is no backfill planned, the answer to #73 is "no, until somebody
moves rows", and the screen was accumulating a second reason to be rewritten in the meantime. What is
bought is a screen already on the shape the migration will land on; what is paid is below.

**A switch — the new read behind a settings flag, legacy as the default.** This was the recommended
option and was rejected deliberately. It leaves two paths to the same data, which is the state 0022
exists to remove, and it makes the screen's behaviour depend on a flag nobody would remember to
delete.

**An adapter from the payments shape to the legacy one.** Forbidden by 0022, and it would have hidden
the three gaps above at exactly the moment they became findable.

**A second call to `/billing/transactions` to state a real billing period.** Rejected for now: it
doubles the network path of a render to recover one row, and this screen never showed a billing cycle.
It is the fix if `expiresAt` proves too coarse.

**Rendering a "no subscription" state instead of redirecting, or sending the member to pricing.**
Both put an activation path in front of the legacy population, which is #85.

**Pulling #77 and #78 in to finish the screen.** They are blocked on the same missing migration, and
0023 makes the writes worse than the read: a cancellation raised as the shared technical account acts
on that account's subscription, not the member's. A read of the wrong account shows wrong data; a
write to it changes somebody else's.

## Consequences

- **The legacy population loses the billing screen.** They are redirected home, and with the screen
  they lose the only place they could cancel. This is the sharpest cost of this decision and it is
  accepted knowingly; it disappears when the migration lands, not before.
- **For the payments population, cancel and reactivate are no-ops**, because legacy holds no record of
  their subscription. The buttons render because payments says the subscription is cancellable.
- **The cancellation dialog no longer confirms itself.** It used to show "your subscription has been
  canceled" off the client-held copy the mutation returned; the copy is gone, and a refresh re-reads
  payments, which never saw the cancellation. That branch of the dialog is pruned rather than left
  unreachable, on 0022's correction of 0021: the screen holding it is itself in scope.
- **An outage is indistinguishable from an absence.** Any refusal, not only a 404, lands in the
  redirect. This is kept knowingly: while 0023 stands, an environment with no payments credential
  sends the call unauthenticated, so a refusal is the ordinary answer there, and rejecting on
  anything but a 404 would show every member an error page instead. The cost is that a payments
  outage ejects the paying population from billing silently.
- **The cancel control now renders for a retrying subscription as well as an active one**, because
  `couldCancel` covers both. That is the reader's rule, not a new one invented here.
- **A retrying subscription is finally named.** `pending` and the next-attempt date replace "Expired"
  plus an offer to buy again.
- **Three gaps in the payments contract are now load-bearing here** — no current period, no
  `incomplete_expired`, no published derived status or entitlement — and are reported upstream rather
  than worked around. `hasAccess` and `pending` are computed in this application, and in the resumewise
  frontend, from the same rule written twice.
- **#69's out-of-scope table is now wrong about this row**, and says so; #77 and #78 carry a note that
  the read has already moved.
- **Verification was the static checks**, per 0022, plus a signed-out request confirming the route
  renders rather than erroring. No signed-in walk was possible from this environment.
