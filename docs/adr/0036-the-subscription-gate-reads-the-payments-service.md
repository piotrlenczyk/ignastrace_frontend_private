# 0036 — The subscription gate reads the payments service

**Status:** Accepted — August 2026. Extends
[0024](0024-the-subscription-read-moves-to-payments-before-the-data-does.md) from one screen to the
whole application, and with it the cost of
[0023](0023-a-shared-technical-account-for-the-payments-upstream.md): every payments call is raised
as one shared technical account, and from here that account's subscription governs every gate.
Reverses the second of [0022](0022-retiring-the-legacy-layer-on-its-own-track.md)'s out-of-scope
lines about subscriptions — the read is not confined to billing any more. Empties one field out of
the mocked membership of [0013](0013-a-mocked-membership-until-the-api-publishes-one.md); the rest
of that fixture survives this record.

## Context

**Around forty screens gate on one function, and that function did not know the answer.** Every
member-area page and every public marketing page calls the subscription gate at the top of its
render. It read the **membership** — the commercial half of a **member**, which no endpoint
published when it was written — out of a hard-coded constant in `libs/membership-mock.ts`. Every
signed-in member was therefore reported as having an active subscription, and the only way to walk
any other path was to edit a line of source and restart the process.

**The gate paid for a call it did not need.** It fetched the member's account from the new API on
every gated render and read exactly one field off it — the invented one. The account service has
nothing to say about a subscription.

**And the constant could not express two states that exist.** A subscription cancelled and since
past its expiry was reported as paying, so the member met screens they no longer had access to. A
subscription the payments service is still retrying payment on was reported as expired, so the
member was offered a new one — which is the shape of the live defect #85.

**One screen already read the real thing.** 0024 moved the billing screen's subscription read onto
the payments service, and its getter already computes the four facts a screen branches on:
`hasAccess`, `couldCancel`, `couldReactivate`, and a `calculatedStatus` that names the retrying
state `pending`. That rule had never been covered by a test.

## Decision

**The gate reads the payments service, and only the payments service.** The three buckets it has
always answered with are computed from the record that service publishes, through the same
`hasAccess` rule the billing screen branches on. One rule for access, one upstream that answers it.
The getter is not rewritten; it gains a caller.

**The mapping is:** no record — a 404 — or a status of `initial` or `incomplete` means no
subscription; `hasAccess` means an active subscription; anything else means an ended one. Nothing
branches on a status directly except the two that mean no payment ever succeeded.

**The account read leaves the gate.** Whether the caller is a member or a signed-out visitor is
settled from the session's own `isLoggedIn` flag, which is a cookie unseal rather than a network
call. A visitor makes no payments call at all. The composed-member read stays in the codebase for
its nine remaining callers and is untouched.

**Guest detection on the session flag is load-bearing, not cosmetic.** The **payments credential**
is seeded for any session the middleware can read, so a visitor holding an empty sealed session
would otherwise be answered with the shared technical account's subscription and redirected off the
public screens.

**Only a 404 means absence. Every other refusal moves nobody, and logs.** This diverges from the
billing screen on purpose, and the reason is the difference between the two callers: that screen
cannot render without the record, so absence and outage are the same thing to it, while the gate
only needs to know whether it is entitled to move somebody. Ejecting the paying population from the
member area on a foreign system's outage — or putting a payment button in front of them — is the
worse failure.

**A service that cannot be reached at all is the same case.** The client rejects on a transport
failure rather than answering with a status, so the gate catches that too and treats it as the
refusal it is. The distinction between a 500 and an unresolvable host is not one a member can act
on, and leaving it uncaught would put an error page on every gated screen — the outcome this branch
exists to prevent, arrived at by the other door. The gate therefore reads three answers, not two: a
subscription, the absence of one, and "unreadable".

**The three status predicates and the legacy subscription-status type are deleted**, along with the
invented `subscription_status` field on the member shape and the dead subscription type beside it.
The **subscription status** vocabulary in this application is now the payments service's five
values and nothing else. The rest of the mocked membership survives and is removed separately.

**The rule is covered by tests for the first time.** The gate's test file moves onto the server-side
test kit, whose only boundaries are `fetch` and the request's cookie jar. Nothing belonging to this
application is substituted, so the getter's `hasAccess` computation, the 404 branch, the bucket
mapping and the redirect itself are all under test in one place.

## Alternatives rejected

**Keeping the account read and adding the payments one.** Two upstream calls per gated render to
answer a question one of them cannot answer at all. The account read is not load-bearing here; it
was only ever the carrier for the invented field.

**Reading the guest case off the composed member rather than the session.** That reintroduces the
account call this record removes, and it is the slower of the two reads by a network round trip.

**Treating every refusal as absence, as the billing screen does.** It would route the entire
population to checkout during a payments outage, which is a payment button in front of members who
are already paying — the failure 0024 was careful to avoid on one screen and this would create on
forty.

**Rejecting on a refusal, so a gated render fails loudly.** An environment with no payments
credential configured sends the call unauthenticated, so a refusal is the ordinary answer there.
This would put an error page in front of every member in every such environment.

**Memoising the payments read per request.** Rejected for now, knowingly. See below.

**Waiting for a per-member credential on the payments upstream.** 0023 stands and has no date. This
record spends its cost rather than paying it off.

## Consequences

- **One shared technical account's subscription now governs the whole application.** Today that
  subscription is active, so the product behaves as it did. When it expires on the development
  instance — and it is a seeded account, not a product — every member will be routed as though their
  own subscription had ended. That will look like a defect in this application and will not be one.
  **This is the single most important line in this record for whoever operates the environment.**
- **Two behaviour changes ride along and are intended.** A cancelled subscription past its expiry
  stops being treated as paying, so that member is sent to billing rather than into screens with
  nothing in them. A subscription in dunning stops being offered for sale, which is #85's shape.
- **A gated render costs one upstream call instead of two**, and the account read has one less
  caller.
- **A billing render makes two payments calls** — the gate in the settings layout, then the screen —
  and every other gated render makes one. There is no request-scoped memoisation, no timeout and no
  data-cache entry; 0023 rejected a timeout and a back-off on this path already. The cost is
  recorded rather than mitigated, and it is the first thing to revisit if the payments service is
  slow.
- **A payments outage leaves everybody exactly where they are**, whether the service refuses or
  cannot be reached. A member on a member-area screen keeps it; a member on a public screen is not
  redirected into the product. Both are logged as incidents, with the upstream's own answer, rather
  than silently absorbed.
- **The gate no longer propagates a payments failure to its caller**, which the billing screen still
  does with the same getter. The two readings of one getter now differ in both directions, and the
  reason is written above the branch rather than left to be rediscovered.
- **Walking the unpaid path is a matter of data, not an edit and a restart.** The gate's answer now
  comes from a record.
- **The contract gaps #90 reports are unchanged** — no current billing period, no
  `incomplete_expired`, no published derived status. `hasAccess` and `pending` are still computed in
  this application from a rule written twice, here and in the reference integration. Still reported
  upstream rather than worked around.
- **Verification was the static checks and the test suite.** No signed-in walk was possible from
  this environment.
