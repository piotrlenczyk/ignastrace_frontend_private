# 0013 — A mocked membership stands in until the API publishes one

**Status:** Accepted — August 2026. Temporary by construction; the exit conditions are listed
below and the record is superseded the day they are met. Two of them have since been met and the
fields have left the payload: the unread notification tally, which the new API's notification centre
answers ([0034](0034-the-notification-centre-moves-whole-and-loses-eleven-languages.md)), and the
subscription's state, which the payments service holds and every gate now reads from there
([0036](0036-the-subscription-gate-reads-the-payments-service.md)).

## Context

The member area learned almost everything about the signed-in person from one call on the legacy
backend. That single response carried two unrelated things at once: the **account** — who someone
is, what they are called, which language they read — and the **membership**, the commercial
relationship the funnel sells. Subscription status, purchased upsells, trial and total prices,
which upsells are still spendable, the unread notification tally, the notification preferences, the
phone number typed during onboarding: all of it arrived together, and a dozen screens grew up
reading it as one object.

The new API answers with the account and nothing else. There is no subscription endpoint, no
purchase-information endpoint, no notification tally, and the one adjacent concept it does publish —
per-product credit balances — is a different model from the funnel's list of product keys, not a
renaming of it.

So the migration ran into a gap that no amount of care at the call sites closes. Half the screens
in the member area exist to gate on facts the new API does not have. An earlier attempt moved the
settings screen onto the new endpoint and commented out everything that could not be answered: the
subscription gate, the unread badge, the notification switches. That left a repository in which a
reader could not tell an intended behaviour from a placeholder.

Worse, the two paths that matter most became unreachable. Every gated screen behaves one way for a
member who has paid and another for one who has not, and with no backend able to answer the
question, neither path could be walked deliberately.

## Decision

**The account is real; the membership is mocked.** The current-user endpoint is the only source of
identity — id, address, name, language — and of the one commercial fact it does answer, whether
unlimited PDF downloads are unlocked. Nothing the endpoint can answer comes from a fixture, because
a fabricated address on the settings screen, or a fabricated entitlement on a report, would hide a
failure of exactly the integration this work exists to build. The member shape records that
entitlement in two places, and both are filled from the one answer, so the gate and the screen it
admits someone to cannot disagree about it.

**One module holds two payloads side by side**, one describing a member who has bought a
subscription and one describing a member who has not, and a third export names the one in force.
Switching the whole application between the two worlds is an edit to that one line.

An environment variable and a cookie-plus-query-parameter switch were both considered. The variable
costs a dev-server restart on every flip; the cookie adds a runtime code path that exists only for
testing, in an application whose session handling is the thing least worth complicating. A file
constant costs a hot reload and nothing else.

**The payloads are typed as the existing member shape minus the fields the account service owns**,
so the type checker refuses a mock that claims an identity, and refuses one that has drifted from
the shape the screens read.

**The existing member shape is kept as it is.** Inventing a contract for a subscription endpoint the
backend has not designed was rejected: a guess would almost certainly be wrong, would have to be
rewritten anyway when the real one arrived, and would force every consuming screen to be rewritten
twice. Keeping the known shape means the consuming screens do not change at all beyond the line
that fetches.

**Two composers, one per rendering environment**, stitch the real account together with the payload
in force and hand back that shape — one for server renders, one for the browser. Every call site
that used to fetch the legacy aggregate calls a composer, so there is one function per environment
to rewrite when the endpoints exist, rather than a dozen call sites to find.

**Everything the earlier attempt disabled is switched back on** and reads the mock: the subscription
gate on the settings screen, the onboarding phone number, the unread count on the notifications
screen, and the unread badge in the member-area chrome. No commented-out block survives this.

**The notification switches stay, interactive, and persist nowhere.** No endpoint accepts them.
Disabling them or removing them would make the screen visibly lose a feature to a migration, so
they show the payload's value and return to it after a save.

## Consequences

**A mocked fact is indistinguishable from a real one at the call site.** That is the price of
keeping the consuming screens untouched, and it is why the seam is one function rather than a habit
spread across the tree: there is exactly one place where invented data enters the application.

**Nothing commercial is true.** Prices shown on the thank-you and upsell screens, the unread badge,
the purchase flags the report screens unlock on — all of them are the payload's. Anything that
reasons about revenue must not read them.

**The switch is the whole testing affordance, and both worlds have to stay reachable.** With the
unsubscribed payload in force the gated screens must redirect rather than render; that is the single
most valuable thing to check by hand after a change in this area.

**Two worlds are not every world.** The subscribed payload describes a member who owns the extras,
because a member whose gate says they own them and whose report screens say they do not is the one
inconsistency these screens must never show. The cost is that the upsell offer itself is unreachable
under either payload — the unsubscribed member is sent to checkout before it, the subscribed one is
sent past it. Exercising the purchase path means editing a payload, not flipping the switch. A third
payload was not added: it would be a world the funnel does produce, but one more thing to keep true
for a screen that is not what this change is about.

**The write path is unaffected.** Profile edits, password changes, language changes and account
deletion all go to real endpoints on the new API. Only what is _read_ about the commercial
relationship is invented.

## Deleting this

The mock goes when the API publishes what it stands in for. Concretely, all of:

- ~~an endpoint answering the subscription's state, in terms the gating decision can be expressed in —
  never bought, active, ended;~~ **met, by the other upstream.** The payments service publishes the
  subscription, and 0036 moved the gate onto it. Not the way this record expected — it is not the new
  API, and the call is raised as one shared technical account rather than as the member — so the fact
  is real but whose fact it is remains wrong until 0023 is paid off;
- an entitlements answer that resolves what the funnel calls **upsellings** into whatever the new
  model turns out to be, and a decision about what the report screens should ask for instead;
- ~~a notification tally~~, **met** — the notification centre publishes the unread count, per 0034 —
  and somewhere to store the two preferences;
- somewhere the onboarding phone number lives.

Until each of those exists, deleting a field from the payload only moves the invention somewhere
less visible. When they all do, the two composers stop merging and start reading, the payload module
is deleted whole, and this record is superseded.
