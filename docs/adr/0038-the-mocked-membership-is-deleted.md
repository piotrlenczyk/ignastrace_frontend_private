# 0038 — The mocked membership is deleted

**Status:** Accepted — August 2026. Supersedes
[0013](0013-a-mocked-membership-until-the-api-publishes-one.md), which stood in for the commercial
half of a member and named the conditions for its own deletion. The last three of its facts left
under [0034](0034-the-notification-centre-moves-whole-and-loses-eleven-languages.md),
[0036](0036-the-subscription-gate-reads-the-payments-service.md) and
[0037](0037-the-funnel-s-purchase-events-report-what-was-bought.md); this record removes what was
left. It takes the shape with it, on the rule
[0022](0022-retiring-the-legacy-layer-on-its-own-track.md) sets and
[0024](0024-the-subscription-read-moves-to-payments-before-the-data-does.md) applied first: a shape
that moves moves without an adapter.

## Context

**The mock outlived what it was for.** It existed because one legacy call answered with the account
and the commercial relationship at once, and the new API answers with the account alone. Half the
member area gated on facts nothing published, so the facts were invented in one module and merged
onto the real account by one function per rendering environment.

Three of those facts have since found their real upstream. The unread notification tally went first,
to the notification centre's own endpoint. The subscription's state went next, to the payments
service, and with it every gating decision in the application. The amounts the funnel's purchase
events reported went last, to the subscription record and the upsell catalogue. Each of those was a
task of its own, and each left the mock a little smaller.

**What was left divides in two, and neither half needs inventing.**

Three fields are answered by the account service, and have been for some time: the two email
notification preferences, and the phone number typed during onboarding. The mock fabricated all
three anyway, and its own documentation still claimed the account service "answers almost nothing" —
which stopped being true when those fields were published. The fabrication was not harmless: every
member saw the same two switch positions and the same invented number, and a member who supplied no
number at signup was treated as though they had.

Four more had no reader at all. The list of extras owned, the prices, the currency beside them and
the two per-extra availability flags were read by nothing: the report screens' gating moved to the
new API's section state under [0028](0028-the-report-reads-move-and-the-unlocks-stay-behind.md), the
order-success screen's ownership guard moved to the payments service under
[0032](0032-the-order-success-extras-move-to-payments-and-the-cart-dissolves.md), and the amounts
lost their last reader under 0037. They were carried because deleting a field from the payload while
the payload existed only moved the invention somewhere less visible.

**And the shape was the old backend's.** The composed member is `snake_case`, and it records the
unlimited-download entitlement twice under two names — once in the list of extras owned, once as a
flag — because the legacy response did. Both were filled from the same account answer, so they could
not disagree; the cost was that every screen reading either had to know that two fields meant one
thing.

**The concept had stopped describing anything.** With the gate reading the payments service and the
events reading what was bought, there is no "membership" in this application: there is an account,
and there is a subscription that belongs to a different upstream.

## Decision

**The mock module and the composition step are deleted.** The server-side account read returns the
account service's own response, typed by the generated specification, with nothing merged onto it.
There is no longer a function where invented data enters the application, because there is no
invented data.

**The domain member type is deleted rather than kept as a shim.** Its readers — the report screens'
download controls, the two report detail screens, the standalone sex-offender search report, the
reverse-lookup completion screen, the settings form and the three funnel confirmation screens — take
the generated response and read its field names. No adapter, no mapping layer, no renamed alias: the
same call 0024 made for the billing screen's shape, for the same reason. An adapter would preserve
the legacy vocabulary indefinitely at the price of one more thing to read.

**The duplicated entitlement collapses to the one field the account publishes.** Every download
control reads the account's own boolean. Nothing about what a member may download changes; only the
number of places that fact is written down.

**Fields with no reader are deleted, not re-sourced.** Finding a real upstream for a value nothing
asks for would be work in service of nobody. If a screen later needs what a member owns, it asks the
upstream that knows — the new API's credit balances, or the entitlement on the current user — which
is the rule 0030 and 0032 already set.

**The notification preferences and the onboarding phone number are read from the account.** The
settings form receives its defaults from its server-rendered parent rather than importing a constant
or fetching for itself, so no browser module has a path to member data that did not come from an
upstream. The funnel's phone fallback keeps its precedence exactly — this run's own number first,
the account's onboarding number second — and simply reads the account field.

**Only the read moves for the preferences.** No endpoint accepts them yet, so the switches still
return to what the account holds after a save. That is unchanged behaviour with a truthful source
rather than an invented one, and the write is somebody else's task.

**Nothing else changes.** This is a deletion: no screen renders differently for a member whose
account says what the fixture said, no route decision moves, and no upstream is called that was not
called before.

## Alternatives rejected

**Keeping the member type as an adapter over the account.** It compiles, it is a smaller diff, and
it is exactly the thing 0022 forbids. The shape's whole justification was that a dozen screens were
written against the legacy response; keeping it after the last invented field is gone preserves a
vocabulary with nothing behind it, and the next reader has to learn that the two unlimited-download
fields are one fact anyway.

**Re-sourcing the dead fields instead of deleting them.** The list of owned extras is the tempting
one, because the new API does publish credit balances. But balances are a different model — how many
of a thing may still be spent, not which things are owned — so this would mean designing a mapping
for a value no screen reads. The deletion is reversible by whoever actually needs it, and they will
know what shape they need.

**Adding tests for the deletion.** A test that the mock is gone asserts on structure, and a test
that a field is read from a different object asserts on plumbing. The type checker carries this
change: with the type deleted, a missed reader is a build failure rather than a runtime surprise.
The one place a test was added is where behaviour genuinely changed shape — the phone fallback's
third answer, "nothing is known", which was unreachable while a fixture answered for everybody.

**Deleting the notification switches along with their invented values.** They would visibly lose the
member a feature to a migration, which is what 0013 refused and this record has no new reason to
reverse. Showing the account's real preferences is strictly better than showing a fixture's.

## Consequences

**Nothing in this application invents member data.** That changes how a wrong value on a screen
should be read. Until now the first question was "is this the mock?"; there is no such question any
more, and a wrong field is a report to make against an upstream rather than a constant to edit.

**0013's testing affordance is gone, and was already going.** Moving the whole application between a
paying and a non-paying world was one line in the mock. The gate stopped reading it under 0036, so
the switch had already lost its main effect; this removes the rest. Walking the unpaid path now
means a session whose subscription the payments service does not hold, which is a fixture in the
gate's own test and a real account in a real environment.

**The two notification switches still persist nowhere.** A member can move them, save, and watch
them come back — now to their own stored preference rather than to a constant. The gap is the same
size it was; it is just visible in the right place.

**Type names in the member area are the generated specification's.** A screen that wants a field
looks it up in the specification, and drifts only when the specification does. The cost is that the
screens' props now name a generated schema, which is a longer thing to write than a domain type and
an honest one.

**The shared technical account is untouched.** Every subscription and payments figure is still that
account's until [0023](0023-a-shared-technical-account-for-the-payments-upstream.md) is deleted, and
that is a deployment away rather than a code change. This record narrows what is wrong on a screen
from "invented or somebody else's" to "somebody else's".

**The vocabulary changes with the code.** "Membership" stops being a live concept: the commercial
relationship is the payments subscription, and a member is an account with one. The glossary says so.
