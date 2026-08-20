# 0022 — Retiring the legacy layer on its own track

**Status:** Accepted — August 2026. Opens a programme of work that
[0009](0009-one-proxy-for-every-browser-call.md) implied and no record had scheduled. It corrects one
sentence in [0021](0021-the-checkout-island-takes-every-payment-but-one.md); that correction is
listed under [What this falsifies](#what-this-falsifies). The track itself is issue #69, whose table is
the only place the whole legacy surface is listed.

## Context

Until now the legacy data layer died by attrition. A screen was redesigned, its fetching was rewritten
onto the new API as part of that work, and the legacy call went with it. The rule in `CLAUDE.md` said
so plainly — legacy plumbing dies with the screen it serves — and the reason was sound: rewriting the
fetching of a screen whose markup is about to be replaced is work that goes in the bin twice.

Attrition has a cost the rule does not name. The legacy layer is not only a set of calls; it is a
whole parallel apparatus — a client factory, a browser hook, a server getter, a proxy with no
specification and therefore no allow-list, and a second backend host in the environment. It survives
as long as its _last_ caller survives, which means the date it is deleted is not a date anyone can
choose. It is whatever date the slowest screen in the redesign happens to land on. Meanwhile every
new contributor reads two data layers and has to be told which one is real, the proxy forwards
whatever path a caller invents, and `docs/adr/0009`'s "the whole layer is temporary" is a claim with
no expiry attached to it.

Counting the surface made the argument concrete: twenty-eight distinct legacy calls, no central
registry of them — every path is a string written inline at its call site — and four of them already
unreachable from any screen.

## Decision

**Retiring the legacy layer becomes a track of its own, independent of the redesign.** A legacy call
is rewritten because it is a legacy call, not because the screen around it is being redesigned. Where
the two tracks collide — a screen migrated here and redesigned three months later — the migration
work is lost and that is accepted. The thing bought with it is a deletion date this application
controls.

**One task is one endpoint, and a task ends when the legacy wrapper is gone.** Not when a new hook
exists beside the old one: two paths to the same data is the state this decision exists to leave.
Grouping is permitted in exactly two cases — where several endpoints are blocked by the same missing
thing, and where the work is literally the same edit repeated — and nowhere else.

**A screen adopts the new response shape; no adapters are written.** An adapter that translates a new
response into the shape a legacy screen already reads is code with no future: it dies at the redesign
along with everything around it, and while it lives it hides the difference between the two APIs from
the only readers who would notice it. Where the new shape is genuinely poorer than the old one, that
is a finding about the API, to be reported as one.

**Two questions about record ownership are answered before the code that depends on them is written,
and they are answered by the backend, not inferred here.** Both are cases where an endpoint pair looks
like a rename and is not:

- Whether the payments service observes a subscription created through the legacy API. Cancelling and
  reactivating through payments while the billing screen reads legacy is only correct if both
  upstreams hold the same subscription. 0021 already recorded this as an accepted risk on
  reactivation; adopting the payments writes turns it from a risk into a prerequisite.
- Whether the new API and the legacy API share reverse-lookup report storage — whether
  `GET /api/v1/reverse-lookup-reports/{id}` finds a report created by `POST /reverse_lookups`. If they
  do, the six-call reverse-lookup family is six independent tasks. If they do not, it is one atomic
  cutover, because a report created in one upstream and read from the other is not a report. The usage
  counter is coupled the same way and for the same reason: a counter migrated alone counts the wrong
  population and reads zero.

Until each is answered the dependent tasks exist, are labelled blocked, and are not started.

**Unreachable legacy code is deleted now rather than left to die with its screen.** Four calls are
already reachable from nothing: subscription creation and subscription sync behind a form whose only
renderer always takes the other branch, a currency-change hook with no callers at all, and a
commented-out service-request read. This is the cheapest reduction of the surface available and it
carries no behavioural risk, which is precisely the calculation 0021 made in the other direction when
that form still had a live screen behind it.

**What the new API does not answer is recorded as a gap, not worked around.** Three families are
blocked on the upstream rather than on us: the standalone sex-offender search, which the new API
models only inside a report; the order-confirmation e-mail, which it does not model at all; and the
notification centre, whose three endpoints publish no response schema — `content?: never` on every
`200` — so a migration there could be neither typed nor paginated. No facade over the old backend is
built to route around any of them. A facade would delete the legacy client by moving it, and the layer
would have to be removed a second time.

**Verification is the static checks, and that is a deliberate limit.** `check-types`, `lint` and
`format:check` are what a task is held to. The screens being touched have no tests, and writing tests
for a screen scheduled for replacement is the same bin as the adapter. The regression risk this leaves
is accepted knowingly, and it is the strongest argument for keeping tasks one endpoint wide.

## What this falsifies

Records are immutable, so the sentence below is corrected here rather than edited there.

- **0021's "The branches in them that are now unreachable … are left verbatim rather than pruned:
  editing code on its way out buys nothing and risks the one screen still using it."** The premise has
  changed rather than the reasoning: the screen still using that form is now itself in scope, so the
  branches are pruned. The reasoning stands wherever a live screen is still behind the code.

## Consequences

**The layer does not die at the end of this track.** Five calls are out of scope by choice — the
subscription read and four of the five upselling calls, the consume call being the one that crosses
over — and six more are blocked on the upstream.
The closing task, which deletes the client factory, the browser hook, the server getter, the legacy
proxy and its route, cannot run until every one of those is settled. Naming them in the epic rather
than omitting them is what keeps that visible; a list that showed only the doable work would read as a
complete path to deletion and is not one.

**"Upselling" still means two things, and this track does not reconcile them.** Only the consume call
crosses over, because it is the one with a genuine counterpart. Buying an upsell and reading which
upsells are owned stay on legacy until the report and upsell screens are remodelled from list-of-owned
to credit-balance, which is a redesign, not a migration. The glossary already separates the two
meanings.

**A screen can end this track on the new API and still be legacy in every other respect** — old
palette, old type scale, old components, no story. That is the intended state and not an inconsistency
to be tidied: the two tracks are independent by construction, and a half-migrated screen is the normal
shape of progress on both.

**There is still no registry of the legacy surface in the code.** The epic's table is the only place
the twenty-eight calls are listed together, and it is outside the repository. The registry that would
survive this — an allow-list on the legacy proxy — is deliberately not built, on 0009's reasoning that
inventing one from the call sites produces a list that goes stale; the surface is shrinking to zero
instead.
