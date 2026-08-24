# 0025 — The subscription writes follow the read onto payments

**Status:** Accepted — August 2026. Completes what
[0024](0024-the-subscription-read-moves-to-payments-before-the-data-does.md) started and reverses its
last standing line: "the writes stay on legacy". It closes #77 and #78, which
[0022](0022-retiring-the-legacy-layer-on-its-own-track.md)'s epic (#69) marked blocked on the record
ownership question #73 answered "no". It reverses one sentence of
[0021](0021-the-checkout-island-takes-every-payment-but-one.md) — "the payments service's own
reactivate endpoint is not adopted" — whose stated obstacle, the missing payments subscription read,
0024 removed. It changes nothing in
[0023](0023-a-shared-technical-account-for-the-payments-upstream.md), and pays that record's sharpest
price knowingly.

## Context

**The billing screen read one upstream and wrote to another.** 0024 moved the subscription read onto
the payments service and left `DELETE /subscription` and `PUT /subscription/reactivate` where they
were, because #77 and #78 were blocked on a data migration that still has no date. The result was a
screen whose two buttons acted on a backend the card in front of them no longer came from: for the
payments population the writes touched no record at all, and the cancellation dialog lost its
confirming face because nothing it could read would ever say cancelled.

**The blocker has not moved, and waiting for it buys nothing here.** #73's answer stands — the
payments service does not observe a subscription created through the legacy API, and there is no
backfill planned. That is an argument for waiting only if the wait ends. 0024 already made the
judgement that it does not, and took the read across; leaving the writes behind preserves the split
without preserving any correctness.

**0023's cost is worse for a write than for a read, and it is the reason to hesitate.** Every payments
call is made as one shared technical account. A read of the wrong account shows wrong data; a
cancellation raised as that account cancels _its_ subscription. 0024 said so plainly and used it to
justify leaving the writes alone.

**The endpoints are a clean match, in one direction and not the other.** payments
`POST /subscriptions/cancel` takes a required body whose only field is an optional free-text
`cancellationReason`, and answers `{ message: string }`. `POST /subscriptions/reactivate` takes
nothing and answers the same. Neither names a subscription: both act on whichever one the service
holds for the cookie. Against that, neither declares a refusal shape — the specification lists 200
and 201 and stops — so a refusal is real at runtime and untyped at compile time.

## Decision

**Both writes move to the payments service, and the legacy wrappers are deleted.** The billing
screen's `_hooks/api/` directory goes with them; the new calls are one-line hooks in
`src/network/payments-api/hooks/`, beside the card change that established the shape. `useApi()` is
now absent from the whole billing screen.

**The screen writes to the upstream it reads.** Cancel and reactivate are followed by
`router.refresh()`, which re-reads payments — the same service that just took the write. This is the
whole of what the decision buys: the card in front of the member finally reflects what the button did.

**No cancellation reason is sent.** The field is for the member's own words, the dialog asks for none,
and the specification says to omit it when none was given. #77 raised the alternative — using the
reason string to make the billing screen distinguishable upstream from the public cancellation form —
and it is rejected: a field for a member's words is the wrong channel for a screen's name, and it
comes back on the subscription read.

**A refusal is shown, not logged.** Each act gets a destructive toast off its own new key under
`__NEW__.settings.billing`, and the body the service refused with goes to the console. The message is
this application's, because the refusal body is untyped and narrowing it would assert the refusal
away.

**The gating is untouched.** `couldReactivate` is "cancelled and not yet expired", which is exactly
what the reactivate endpoint resumes, so the button needed no change. `couldCancel` also covers
`pending` — a subscription payments is still retrying — and the specification does not say whether
cancellation is accepted there. That stays as it is: the rule belongs to the subscription reader, not
to this change, and a refusal is now visible rather than silent.

**The dialog owns the cancellation it confirms.** It closes on success and refreshes; the confirming
face 0024 pruned does not come back, because the answer is an acknowledgement with no subscription in
it and the refreshed card says everything that face said. It also fixes a defect of the old shape: the
dialog used to stay open over the refreshed screen.

**The public cancellation form is out of scope and stays on legacy.** `/cancellation` cancels by
e-mail with no session; payments publishes no unauthenticated cancellation, and
`/internal/subscriptions/cancel` is in a path family the payments proxy refuses by design.

## Alternatives rejected

**Waiting for the migration, as 0022 decided and 0024 reaffirmed for the writes.** Rejected on the
same reasoning 0024 used for the read, now with one addition: the split upstreams are themselves a
defect, and every week they stand is a week the screen lies to whichever population it is not serving.

**Moving only the cancellation (#77), leaving reactivation on legacy.** Honours 0022's "one task is
one endpoint" but produces a screen that cancels in one service and resumes in another — a sharper
version of the inconsistency being removed.

**A constant `cancellationReason` naming the screen.** The only channel payments offers for telling
the two cancellation surfaces apart, and the reason #77 asked the question at all. Rejected above.

**Narrowing `couldCancel` to `active`, so no call is made in a state payments might refuse.** Rejected:
it would take away the only exit a member in dunning has, on a guess about an endpoint whose refusals
are undocumented.

**Reading `message` out of the refusal and showing it.** Rejected: it is a foreign service's untyped
text, in a language nobody promised, in front of a member.

## Consequences

- **On any environment where the payments credential is configured, a member's cancellation cancels
  the shared technical account's subscription.** This is 0023's cost, now paid by a write. It is the
  sharpest consequence of this record and it is accepted knowingly; it disappears when that upstream
  trusts this application's tokens, not before.
- **For the legacy population nothing changes and nothing improves.** They are already redirected off
  the billing screen by 0024's read, so they reach neither button.
- **The billing screen is off the legacy client entirely.** Two of #69's rows close together.
- **A refusal is now visible to the member for the first time on this screen** — previously both
  failures ended in `console.error` and a button that appeared to do nothing.
- **Whether cancellation is accepted for a `pending` subscription is now discoverable in production**
  rather than by reading a specification that does not say. If it is refused, the fix is a gating
  change and a note upstream.
- **The glossary's three senses of "reactivation" collapse to two**: buying again after expiry, and
  calling off a cancellation — the latter now one act on one endpoint rather than a legacy button
  standing apart from the payments operation that does the same thing.
- **Verification was the static checks plus unit tests** over both hooks — path under the proxy mount,
  method, the empty body cancellation demands, and the refusal path. No signed-in walk was possible
  from this environment, as with 0024.
