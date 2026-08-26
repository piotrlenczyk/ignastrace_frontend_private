# 0033 — The funnel's report creation follows the member's onto the new API

**Status:** Accepted — August 2026. **Lifts the carve-out**
[0027](0027-the-reverse-lookup-creation-starts-on-an-unanswered-assumption.md) made for the anonymous
funnel: that record moved the member's report creation onto the new API and deliberately left the
funnel's on the legacy backend. Every clause of the argument it left it on has since been reversed by
[0028](0028-the-report-reads-move-and-the-unlocks-stay-behind.md),
[0029](0029-the-upsell-price-moves-to-payments-and-the-charge-stays-behind.md),
[0030](0030-the-upsell-charge-follows-the-price-and-the-credit-is-spent-on-the-new-api.md) and
[0032](0032-the-order-success-extras-move-to-payments-and-the-cart-dissolves.md). It proceeds on the
same unanswered assumption 0027 did, and answers nothing new. With it, `POST /reverse_lookups` has no
callers, and the reverse-lookup family is entirely off the legacy data layer. It closes #104 on the
track's epic (#69) and the last of #79's six calls.

## Context

**One legacy write survived the reverse-lookup family's migration, and it survived for a stated
reason.** 0027 moved the member's creation and ring-fenced the funnel's on one argument: "everything a
visitor sees after paying — the upsell screens, the report, the PDF — reads the legacy backend", so
moving the write would bet a paying visitor's report on the record-ownership question the backend has
never answered. The blast radius, not the call, was the reason.

**That radius is now empty.** The report, its sectioned view, its data-breach records and its
sex-offender records are read from the new API (0028). The funnel's three upsell steps read their offer
and their price from the payments catalogue (0029, 0030), and the order-success extras followed (0032).
The funnel's thank-you screen reads the member from the new API. Nothing a funnel visitor opens after
paying reads the legacy backend any more.

**So the exposure has inverted.** The funnel writes a record to an upstream that nothing downstream of
it reads, and the report that visitor eventually opens in the member area is asked of the new API. The
call as it stands is not protected by the record-ownership question — it is the thing _creating_ the
divergence the question is about. Leaving it makes more of that divergence with every payment; moving
it stops making any.

**Three faults ride along with the call.** It is untyped end to end — string path, bag body, a response
interface hand-written here. It keeps the unspecified proxy and the second backend host alive for one
write. And the compact legacy report shape survives in this repository solely because this one call
answers with it.

**The screen discards everything the call returns.** Both callbacks navigate to the same place and the
identifier is never read, which is what makes this a change of upstream and nothing else.

## Decision

**The funnel's checkout creates the report through the new API's creation operation, and this lifts
0027's instruction.** The record-ownership question is still unanswered and this record does not answer
it; it records that the ground the carve-out stood on is gone.

**The failure symptom, stated so nobody has to debug a funnel: if the two upstreams do not share
reverse-lookup report storage, reports created by the funnel after this lands open an empty or failing
report screen in the member area, while reports created before it open normally.** That is the inverse of
the symptom 0027 named for its own change, and the remedy is the same in kind — revert this creation
call, do not patch the report screen.

**A second, quieter failure mode is named here too.** The call fires in the seconds after a payment
succeeds. If the new API gates report creation on an active subscription and has not yet observed the
payment, the refusal is a 403 with no distinguishing code, the visitor is carried onward as designed, and
the report simply never exists. The visible symptom is a paying visitor whose activity list is empty. The
question to put to the backend then is whether creation is gated on subscription state and when that
state becomes visible — not whether to add a retry.

**No wait, no poll, no retry for that propagation.** The operation declares 401 and 403 and nothing
else, and its 403 carries no code specific to an inactive subscription, so there is nothing to recognise
and nothing to branch on. The sibling product handles the same situation the same way — its
payment-success handler performs no API write at all, and its post-checkout purchase attempts the
entitled write immediately, branching only on one declared code — and this repository's own upsell
unlock sequence has that shape already. A bespoke wait here would make one screen the only place in the
codebase with one, to defend against a mechanism nobody has confirmed exists.

**The migration is behaviour-preserving in every respect a visitor can observe.** The call fires from the
payment-success path, guarded by the presence of a funnel phone number exactly as before — including the
path a visitor returns on from a redirect-based 3-D Secure challenge, which reaches the same handler.
Both callbacks navigate to the first upsell step. The identifier, the report status and the synchronously
captured carrier and line type are all discarded. The screen adopts the new response shape by ignoring
more of it, not by rendering more of it.

**One hook serves both callers, moved into the shared hooks directory.** The new API's creation hook
leaves the member area's phone-lookup hooks directory and takes the place the legacy wrapper occupied,
keeping its name, its callback contract — an identifier on success, the refusal envelope on failure — and
its behaviour. Its callers sit on either side of the member-area boundary, which is the same reason 0027
put the legacy wrapper there, and a screen should not reach across into another screen's hooks directory
for a call that is not about that screen. The member screen's import is updated and nothing else about
that screen changes. The funnel supplies two callbacks that do the same thing, which is a faithful
statement of what it wants rather than a defect to tidy.

**The rolling-allowance refusal stays the member screen's business.** The module that recognises the
too-many-requests code in either of the two enumerations that carry one is not moved and not extended to
the funnel. The funnel branches on no error code at all: every refusal, of any kind, sends the visitor
onward. A funnel visitor is a freshly registered account creating its first report, so the allowance is
not the refusal that screen realistically meets.

**The legacy wrapper and its response type are deleted.** The compact legacy report shape loses its last
consumer and goes with it, and the header comment of the module it lived in is corrected so that it stops
describing a consumer that no longer exists. The two shapes the standalone sex-offender search reads stay,
because that endpoint is untouched.

**The legacy proxy's own comment is corrected, outside the change.** That comment argues for having no
path allow-list by counting the hooks that call it, and the count has been stale for several tasks and is
stale again after this one. It now states the surface actually left — five call sites, named — because the
argument it supports is the one a reader weighs when deciding whether the proxy is safe to leave standing.

**Nothing about the phone number changes.** Both callers already read the number from the same funnel
source, and the member screen already passes that value to this operation, so no normalisation, guard or
format change is introduced.

## Alternatives rejected

**Waiting for the backend to answer the record-ownership question.** Rejected on the reasoning 0024
established and 0025, 0027 and 0028 each repeated: an argument for waiting is only an argument if the wait
ends, and this one has no date. Here it is weaker still — waiting does not hold the risk steady, it grows
it, because every payment taken in the meantime adds a report created in one upstream and read from the
other.

**Retrying or polling until the subscription is visible to the new API.** Rejected: nothing establishes
that creation is gated on subscription state, the specification declares no code that would say so, and
the wait would be the only one of its kind in this codebase. If the symptom is seen, the answer is a
question to the backend, not a loop on a payment screen.

**Holding the visitor on the payment screen when creation is refused.** Rejected, and not revisited —
0027 made this judgement about this exact screen. A visitor whose money has just moved should not be
stopped by a failed secondary write. What changes here is only which upstream the write goes to.

**Reading the identifier out of the response and driving the funnel from it.** Rejected as out of scope:
it needs a failed-report state the product does not have, on a screen awaiting redesign.

**Leaving the new hook in the member screen's directory and importing it from the funnel.** Rejected for
the reason 0027 gave when it moved the legacy wrapper out: the funnel would be reaching across a route-group
boundary into a member screen's hooks for a call that is not that screen's.

**Copying the hook so each screen has its own.** Rejected: one endpoint, one hook. Two copies of the same
call are two things that can drift.

## Consequences

- **`POST /reverse_lookups` has no callers, and the reverse-lookup family is entirely off the legacy data
  layer** — creation, the report read, its sectioned view, its data-breach and sex-offender records, the
  usage count and the upselling consume. #79's last row closes as a row rather than shrinking again.
- **The funnel's checkout screen is off the legacy client**, while remaining legacy in palette, type
  scale, components and stories, and outside the migrated-paths ratchet. 0022 calls that the normal shape
  of progress.
- **If the storage assumption is false, the symptom now lands on paying visitors as well as members.**
  That is the split 0027 deliberately protected, given up deliberately here, because leaving the call in
  place is what keeps creating the divergence.
- **Reports created before this lands stay in the legacy backend** and are still read from the new API.
  This stops new divergence; it does not migrate the existing population. A report that does not open is
  diagnosed by its creation date.
- **The legacy layer's browser surface is five call sites**: the notification list and its read-marking
  write, the standalone sex-offender search and its legacy upselling purchase, and the public subscription
  cancellation. None is blocked by the question this family was blocked on; the notification centre and the
  sex-offender search are blocked on gaps in the new API, and the cancellation on the subscription question.
  The epic's closing task still cannot run.
- **The compact legacy report shape is gone**, so no type in this repository describes a response nothing
  receives.
- **Verification was type-checking, linting, format checking and the full test suite.** The creation hook's
  existing test travelled with the hook and needed no new cases: the hook does not know which screen calls
  it, so a second caller exercises the same seam. No test was written against the funnel's screen, per
  0022's stated limit — opening a rendering seam there for behaviour being preserved rather than introduced
  would set a standard for one screen that nothing else on the track meets. The one thing the static checks
  cannot show is whether a newly created report opens, which is what a manual pass through the funnel on a
  configured environment is for.
