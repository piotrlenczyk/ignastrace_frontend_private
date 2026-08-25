# 0027 — The reverse-lookup creation starts on an unanswered assumption

**Status:** Accepted — August 2026. Starts work that
[0022](0022-retiring-the-legacy-layer-on-its-own-track.md) instructs is not to be started, and
reverses that instruction for two of the six calls in the reverse-lookup family. It extends the
assumption [0026](0026-the-activity-feed-becomes-the-list.md) already made in the reading direction
into the writing direction. It is the third record to reverse a line of 0022, after
[0024](0024-the-subscription-read-moves-to-payments-before-the-data-does.md) and
[0025](0025-the-subscription-writes-follow-the-read-onto-payments.md), and it closes #94 on the
track's epic (#69).

## Context

**Two calls answer the member's phone lookup screen and both were on the legacy surface**: the one
that creates a reverse-lookup report, and the one that reads how much of the member's rolling daily
allowance is left. They are the only calls in that family a member triggers directly, and the
creation is the only write. Being on that surface means untyped end to end, forwarded by a proxy with
no specification and therefore no path allow-list, and pointed at a second backend host that exists
for them alone. It also meant the one refusal the screen can say something useful about — a spent
allowance — was recognised by reading the HTTP status, the branch this codebase has decided
everywhere else not to take.

**0022 says these two calls are blocked.** Its second record-ownership question is whether the new
API and the legacy API share reverse-lookup report storage — whether
`GET /api/v1/reverse-lookup-reports/{id}` finds a report created by `POST /reverse_lookups`. Until
the backend answers, the family's tasks "exist, are labelled blocked, and are not started". The
answer has not arrived and no date is attached to it.

**There is no member-visible symptom to fix.** The driver is the deletion date: the legacy apparatus
goes when its last caller goes, and every call left on it postpones that date indefinitely.

**One piece of circumstantial evidence bears on the question, and it is not the part that matters.**
The new API's activity feed already lists reverse-lookup rows for reports created through the legacy
call, so the two sides agree on which records exist. That does not establish that the report read
finds them, which is precisely what is being assumed.

## Decision

**The task proceeds on the assumption that the two APIs share report storage**, against 0022's
instruction, and this record exists so that a reader who finds that instruction can see it was
disobeyed deliberately rather than missed.

0026 already adopted the same assumption in the reading direction: its rows are listed by the new API
and open a screen reading the legacy backend. This adopts it in the writing direction, which is
strictly stronger — hence a record of its own rather than a lean on that one.

**The failure symptom, stated so nobody has to debug a screen to find it: reports created after this
ships open an empty or failing report screen, while reports created before it open normally.** If that
is seen, the assumption was false and the remedy is to revert the creation call, not to patch the
report screen.

**Two endpoints travel in one task**, under 0022's grouping exception for endpoints blocked by the
same missing thing. Both are gated by the same unanswered question, and separating them would leave
the screen showing an allowance read from one backend while the gate enforcing it lives in the other
— 0022 names that coupling itself when it says a counter migrated alone counts the wrong population.

**The creation is a mutation, not a server action.** None of the three conditions holds: no cookie of
its own is set, no server-side redirect happens, no Next cache is invalidated. The funnel phone number
is written by a separate action with other callers, and the navigation after is the browser's.

**Only the identifier is read out of the creation response.** It also carries a status and the carrier
and line type the API captured synchronously. Showing the carrier during the progress animation would
be a new product capability on a screen awaiting redesign; 0022's rule is that a screen adopts the new
response shape, not that it consumes everything in it.

**The asynchronous report contract is not adopted.** The new API states that creation starts a
background job polled for status. This does not poll: the screen counts an animation down and then
offers the report, exactly as before, and the status field is not read. This is behaviour-preserving
rather than behaviour-improving — the legacy call could already answer "pending" and the screen already
ignored it. Adopting the contract properly means designing a failed-report state the product does not
have, which is a separate task. The glossary now names the three vocabularies involved so that whoever
does it does not invent a fourth.

**The refusal is recognised by error code, in a module of its own that accepts two of them.** The
specification makes this awkward and the module exists because of it: the creation operation declares
only 401 and 403, the rolling-window limit of five reports per day is described in prose and declared
nowhere, and the generated types carry two plausible codes for it — `TooManyRequestsErrorCode`, which
collapsed onto its HTTP-status enumeration as `TOO_MANY_REQUESTS`, and the shared business
enumeration's `TOO_MANY_REQUESTS_ERROR`. One small module beside the flow accepts both, each constant
typed against its own generated enumeration so a rename upstream fails the build rather than dropping
the member into the generic message. It reads the code out through the same parser the server-side
layer reads a refusal with rather than taking the envelope apart itself — a browser call is typed to
its operation and so arrives unparsed, and this refusal is the one the operation does not declare, so
there is nothing to narrow it to and no second description of the envelope is written. Which code the
backend really sends is deliberately not established first; accepting both is what makes that
unnecessary.

**The allowance read follows the SMS compose screen rather than the letter of the data-layer rule.**
It is read server-side through the generated client and path, and — like the twin screen's dispatch
count — it is not put through `unwrapApiResponse` and a refusal does not fail the render; the fallback
is a spent-nothing count against the published limit. This departs from "read a response through
`unwrapApiResponse`" in company: the counter is decoration, the gate is the creation call, and two
counters in one product reacting differently to one outage would be a worse outcome than the
inconsistency with the rule.

**Nothing downstream of the counter changes.** The two responses are identical — a count and a limit —
so the shared counter component and the legacy type it takes are left alone. That type is also read by
the SMS screen; renaming it would drag an unrelated screen in. Nothing is translated, so this is not an
adapter. The read does move to after the screen's subscription redirect, where the twin screen has it:
a member on their way to billing no longer pays for a counter they will not see.

**The anonymous funnel keeps the legacy creation call, and one legacy wrapper therefore survives this
task.** This is the one place the specification for #94 was wrong: it states that the public
reverse-lookup pages create no report, and they do — the funnel's checkout screen and the Stripe form
it renders both called the member area's creation hook across a directory boundary. The task's stated
completion condition, both legacy wrappers gone, is not met for that reason, and the behavioural
instruction was followed instead: the funnel behaves exactly as it does today.

The reasoning is the assumption's blast radius. Everything a visitor sees after paying — the upsell
screens, the report, the PDF — reads the legacy backend, so moving that call would bet a paying
visitor's report on an assumption this record ring-fences them out of. The legacy call becomes a hook of
its own among the shared hooks, named for the backend it talks to and placed where both its callers
already are rather than inside a member screen they were reaching into.

**That hook is a new file importing a frozen client, and the rule it appears to break is named here so
nobody has to guess.** "New code must not import the legacy clients" is about not adding legacy callers;
this adds none — it is the same call, made by the same two screens, relocated so that the member screen's
hook name no longer covers two upstreams. It is the last caller of that path, and the row it leaves on
the epic is the record of that.

## Alternatives rejected

**Waiting for the backend to answer, as 0022 instructs.** Rejected on the reasoning 0024 established
and 0025 repeated: an argument for waiting is only an argument if the wait ends, and this one has no
date. The cost of being wrong here is bounded and loudly visible — one screen's newly created reports
fail to open — where the cost of waiting is the deletion date staying unownable.

**Establishing which too-many-requests code the backend sends, then matching it.** Rejected as work
that buys nothing: accepting both codes is correct whichever answer comes back, and one of the two is
already a dead branch somewhere either way.

**Reading the status off the creation response and driving the progress screen from it.** Rejected as
out of scope: it needs a failed-report state that does not exist, and the screen it would change is
awaiting redesign.

**Putting the allowance read through `unwrapApiResponse` and letting a refusal fail the render.**
Rejected: it makes a decorative counter able to take down the form, and it splits the behaviour of two
counters in the same product.

**Moving the anonymous funnel's creation across too, so both wrappers die as #94 asks.** Rejected
above. The narrower version — moving it and keeping the funnel's existing "a refused creation still
sends them onward" behaviour — was also rejected: it survives a refusal, not a report created in the
upstream the next four screens do not read.

**Leaving the funnel's call where it was, under the member screen.** Rejected: the member screen's hook
is now the new API's, and a legacy call hiding under that name and in that place is the "two paths to the
same data" state 0022 exists to leave.

## Consequences

- **The member's phone lookup screen is off the legacy client entirely**, while remaining legacy in
  palette, type scale, components and stories. 0022 calls that the normal shape of progress.
- **Two rows close on #69, and one does not close as planned**: `POST /reverse_lookups` survives with
  the anonymous funnel as its only caller, which makes it a row on the epic that depends on the public
  funnel rather than on the backend's answer.
- **If the storage assumption is false, the symptom lands on members and not on paying visitors.** That
  split is the whole point of the previous consequence.
- **The reverse-lookup family is now started, so 0022's second record-ownership question is no longer a
  gate.** The remaining four calls — the report read, the sectioned view, the data-breach read, the
  sex-offender read, the PDF export — are unblocked by this record's assumption in the same way, and the
  report read is the one whose migration would test it directly.
- **Two specification defects are recorded and not fixed**: the rolling-window refusal is not declared
  on the creation operation at all, and two enumerations carry a code for it. Raising them upstream was
  deliberately left out of #94.
- **The SMS flow's equivalent guard may have a dead branch.** It compares against `TOO_MANY_REQUESTS`
  while its own comment says the backend sends `TOO_MANY_REQUESTS_ERROR`. If that is live, the SMS screen
  shows a generic message where it should show a limit message. Not touched and not diagnosed here; the
  new module accepting both codes is why this one cannot repeat it.
- **Verification was the static checks plus the test suite**, with two new tests: the creation hook at
  the network seam — path under the proxy mount, verb, body key, the identifier reaching the success
  callback, and a refusal reaching the error callback as the envelope — and the refusal-recognition
  module by direct call. No test was written against the screen, per 0022's stated limit; no seam was
  opened on the server side, because reaching the server test kit would mean extracting the allowance
  read into a module existing only to be testable and would put this screen out of step with the twin
  screen that reads its counter inline.
