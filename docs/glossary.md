# Glossary

The words this codebase uses for the things it models, and what each one means here
specifically. When a term has a general meaning in the industry and a narrower one in this
project, the narrower one wins — that is what this file is for.

Terms are grouped by the area of the application they belong to. Add a term when its
meaning is not obvious from the code, or when two people have already used it to mean two
different things.

## Session and authentication

Introduced by [ADR 0008](adr/0008-a-sealed-session-on-the-new-api.md), which records why the
model looks like this. The **proxy** and everything that follows from closing the access token
are recorded in [ADR 0009](adr/0009-one-proxy-for-every-browser-call.md), which also defines the
vocabulary of the data layer around it.

**Session**
: What the application knows about the person making a request: their identity, the tokens
that authenticate them, and when the access token expires. It lives in one sealed, http-only
cookie, so no part of it is legible to a page script. Client components learn who is signed
in from the **session provider** the root layout renders out of that cookie — identity only,
never a token.

**Access token**
: The short-lived credential sent to the API as a bearer token to prove who the caller is.
It carries the identity in its own claims, which is where the session gets the account's id,
email, account type and roles rather than asking an endpoint for them. It never leaves the
server: a call from the browser goes through a **proxy**, which attaches it on the way past.

**Proxy**
: A route handler in this application that forwards a browser's call to a backend with the
session's bearer attached server-side. There are two — one onto the new API, which validates
the path against the generated specification, and one onto the legacy backend, which has no
specification and is bounded by the single host it forwards to. Both discard any
`Authorization` the browser supplies, so the session's token is the only one presentable.

**Refresh token**
: The long-lived credential that buys a new access token when the current one expires. It
never leaves the sealed cookie, and it **rotates** — spending it yields a new refresh token
and invalidates the old one. That rotation is why two requests renewing at the same time can
sign a user out; see the ADR's consequences.

**Renewal**
: Exchanging an expired access token for a fresh pair. It happens in the middleware, before
the request is served, so that a token expiring in the background never surfaces to the
person using the site. A renewal that fails clears the session and the request continues as
anonymous — it does not redirect, because a middleware redirect is not followed for a server
action.

**Payments credential**
: The second token pair the session carries, for the payments upstream — which authenticates a
caller by a cookie holding a token _it_ issued, and therefore recognises none of the pair above.
It belongs to one technical account rather than to the member, is seeded from configuration and
renewed in the middleware alongside the API pair, and is the only credential the payments door
presents. It says nothing about who anybody is; identity comes from the **access token** and only
from there. Temporary, and switched off by unsetting its configuration —
[ADR 0023](adr/0023-a-shared-technical-account-for-the-payments-upstream.md) records the
trade-off it buys and the condition for deleting it.

**Protected route**
: A path only an authenticated account may open. An anonymous visitor on one is sent to the
login route with their original destination preserved, so signing in returns them to where
they were going. The member area is protected by prefix; checkout and its outcomes are
listed explicitly.

**Auth route**
: A path that exists to authenticate — login and the sign-up screens. The mirror of a
protected route: an _authenticated_ visitor on one is sent to their dashboard, because a
form for something already done is not worth showing.

**Guest**
: An account type the session carries and the guards refuse, treating it as anonymous on a
protected route. No guest session is ever created by this application. The type is honoured
because the API can issue one, not because anything here produces one.

## The member and what they have bought

One legacy call used to answer all of this at once, which is why the two halves below are easy
to confuse. [ADR 0013](adr/0013-a-mocked-membership-until-the-api-publishes-one.md) records why
one of them is currently invented.

**Account**
: Who someone is, as the account service holds it: an identifier, an email address, a display
name, a language, a photo, an account type. It is the thing authentication issues a token for,
and the only part of a member the new API answers questions about.

**Membership**
: The commercial relationship — what has been paid, what extras are owned, what a member has asked
to be notified about. It is _not_ part of the account, and the screens that read what is left of it
read a fixture. One part of it has left: the state of the subscription, which the payments service
publishes and which every gating decision now reads from there
([ADR 0036](adr/0036-the-subscription-gate-reads-the-payments-service.md)).

**Member**
: The account and the membership seen as one object, which is the shape every screen in the
member area reads. It exists because the legacy call answered in that shape and a dozen screens
were written against it; it is composed rather than fetched.

**Subscription status**
: The payments service's vocabulary, and the only one this application has: `initial`, `incomplete`,
`active`, `cancelled`, `expired`. A sixth value is derived rather than published — `pending`, for a
subscription the service is still retrying payment on, which is `expired` carrying a next payment
attempt.

Access is not a status but a rule, `hasAccess`, computed once where the subscription is read:
`active`, `cancelled` before its expiry, or `expired` with an attempt still to come. The three
buckets the **subscription gate** routes on are built from it — no record at all, `initial` or
`incomplete` mean no subscription; `hasAccess` means the member is paying; anything else has ended.
Those two statuses are the only ones anything branches on by name. Where each bucket sends somebody
is the call site's to say, and by convention it is checkout for the first and billing for the last.

**Subscription gate**
: The one question every screen that gates on paying asks: where does this caller belong? It answers
with a route or with nothing, out of three buckets — no subscription, active subscription, ended
subscription — and each call site names where each bucket sends somebody. A signed-out visitor is
always left where they are, and so is a member whose subscription cannot be read at all: an outage
in the payments service moves nobody
([ADR 0036](adr/0036-the-subscription-gate-reads-the-payments-service.md)).

**Reactivation**
: Buying a subscription again after the previous one **expired**. A member in that state is not
eligible for the trial, so the price they are offered is the non-trial four-week product, resolved
strictly — where no catalogue publishes one, they are offered nothing rather than a trial. It is a
purchase like any other: the payments service takes it through the checkout island, and it is
reported as a placed order.

It is **not** calling off a cancellation. That is the second act the word covers: resuming a
subscription that was cancelled but has not expired yet, which takes no payment. The two share a word
and nothing else — one takes money for a new subscription, the other undoes a decision about an
existing one.

**Calling off a cancellation**
: Resuming a cancelled subscription before it expires. The billing screen offers it wherever the
subscription is cancelled and its expiry is still ahead, and it is the payments service's own
reactivate endpoint — one act on one endpoint, not a button and an operation standing apart.
[ADR 0021](adr/0021-the-checkout-island-takes-every-payment-but-one.md) records why only the other
sense takes a payment; [ADR 0025](adr/0025-the-subscription-writes-follow-the-read-onto-payments.md)
records adopting that endpoint here, reversing 0021's line about it.

**Cancelling a subscription**
: Ending a running subscription so that it does not renew. It happens on two unrelated surfaces, and
the difference between them is who is asking. On the **billing screen** a signed-in member cancels
their own, and the payments service knows which one from the session's cookie — it names no
subscription. On the **public cancellation form** (`/cancellation`) somebody who is not signed in
cancels by typing an address, so the subscription has to be named: the address is resolved to a user
and that user's subscription is cancelled by id.

The two are one act on two surfaces, and the payments service tells them apart by
`cancellationSource` — a field only the second surface's endpoint offers, whose value for it is
`public_cancellation`. That is the channel
[ADR 0025](adr/0025-the-subscription-writes-follow-the-read-onto-payments.md) wanted and refused to
fake through the free-text reason field;
[ADR 0035](adr/0035-the-public-cancellation-follows-onto-payments-through-a-server-action.md) records
the second surface arriving on an endpoint that publishes it.

It is **not** the same as calling off a cancellation, which undoes it, or as a member deleting their
account, which is a different act with its own endpoint — though two of the four cancellation sources
the payments service publishes are documented as doing both at once.

**Upselling**
: **Three different things, and no two of them map onto each other.**

In the funnel, an upselling is one of seven product keys held as a list on the member — the
extras someone bought alongside the subscription. Owning one is what lets a report screen
unlock the corresponding section, and having any at all is what sends a member past the upsell
offer instead of into it.

In the new API, an upselling is a per-product **credit balance** over three products on an
endpoint of its own: how many of a thing a member may still spend, not which things they own.

In the payments service, an upselling is a **product in a catalogue**, identified by
`metadata.productSlug` and carrying a price in cents. It is where an amount is read from, and it
says nothing about who owns what. Since [ADR 0029](adr/0029-the-upsell-price-moves-to-payments-and-the-charge-stays-behind.md)
every upsell price on screen comes from here, and since
[ADR 0030](adr/0030-the-upsell-charge-follows-the-price-and-the-credit-is-spent-on-the-new-api.md)
**this is also where an upsell is bought** — `POST /products/upsell/buy`, against the same price row
whose amount was displayed, so the two numbers agree. One purchase stays on the legacy catalogue: the
standalone sex-offender search, whose call also creates the search report.

Ownership is read from neither of those, with one stated exception. For the three credit-balance
products it is the new API's balances; for unlimited PDF downloads it is the entitlement on the
current user. The payments service's own purchased-products endpoint is not asked for any of those,
because every payments call is made as one shared technical account and its per-user answers would be
that account's. **The exception is the order-success screen's two extras, `scan_pro` and
`support_hotline`, whose ownership is read from exactly that endpoint** — it is the only upstream that
knows anything about them at all, and the cost is that one purchase by anybody withdraws the offer
from everybody. [ADR 0032](adr/0032-the-order-success-extras-move-to-payments-and-the-cart-dissolves.md)
records the reversal, and [ADR 0030](adr/0030-the-upsell-charge-follows-the-price-and-the-credit-is-spent-on-the-new-api.md)
the rule it is an exception to.

There is no one-to-one translation between the first two, and adopting the credit balance means
remodelling the report and upsell screens rather than renaming a field. The single overlapping
concept is **unlimited PDF downloads**, which the new API publishes as a boolean entitlement on the
current-user response — the one commercial fact the account service does answer. The three
vocabularies are joined only by two constants that sit side by side in `src/libs/upsell-products.ts`
and are exhaustive over the legacy key union: `UPSELL_PRODUCT_SLUGS`, the payments slug each key is
looked up by, and `UPSELL_CREDIT_PRODUCTS`, the new API's credit-balance product each key names — or
`null`, where the new API holds no balance for it.

**Purchase information**
: What a member paid and what they may still spend: the trial price, the total, what the extras
came to, and a flag per extra saying whether there is anything left to spend on it. The flags are
what the report screens unlock on.

**The three prices have no reader left.** The confirmation screens that reported them to analytics
now read the subscription record's own product price and the upsell catalogue instead
([ADR 0037](adr/0037-the-funnel-s-purchase-events-report-what-was-bought.md)), so `trial_price`,
`total_price` and `upsellings_price` — and the member's `currency` beside them — are invented
numbers nothing asks for. They stay until the mocked membership is deleted whole.

## The checkout funnel

**Checkout attempt**
: One visitor's run at buying a subscription, as the funnel records it: the **funnel plan** they
chose, and the currency they chose if they chose one. Nothing else — no identifier, no amount, no
address. It is written in the browser, read on the server render of checkout, and discarded when a
payment completes. It lives for the browser session only, so a shared computer does not hand one
visitor's choices to the next.

It **absorbed the funnel's own plan cookie**, which no longer exists: two cookies holding a plan
could disagree about what someone chose, and one of them died on every reload. If you are looking
for where the plan is kept, this is it — do not add a third cookie.
[ADR 0019](adr/0019-the-parked-checkout-island.md) records why an earlier version of this record was
removed and what had to be true for it to come back.

**Funnel upsell record**
: What one funnel run bought _on top of_ the subscription — a list of **upsell** keys, in the order
they were charged for. Written by the funnel screen that took each payment, read once by the
confirmation screen at the end of the run, and discarded there. It is the only thing that passes
between a purchase made in the browser and a confirmation screen rendered on the server.

It is **not** part of the Checkout attempt and must not become a field on it: a completed payment
ends the attempt, and the upsell steps run afterwards. Like the attempt it lives for the browser
session only, states keys in the funnel's own vocabulary rather than the catalogue's, and is refused
whole if it does not parse.
[ADR 0037](adr/0037-the-funnel-s-purchase-events-report-what-was-bought.md) records why the funnel
needed one at all: without it, every visitor who reached a thank-you screen was reported as having
bought the same invented amount, refusals included.

**Plan**
: **Two different things, and both are correct in their own place.**

The **funnel plan** is what the visitor answered on the homepage — `trial` or `subscription`. It is
the funnel's own vocabulary, it is what the Checkout attempt records, and it is deliberately not the
catalogue's, so renaming a product does not invalidate cookies already sitting in browsers.

The **catalogue product** is what the payments service sells and charges — `FOUR_WEEKS_TRIAL`,
`FOUR_WEEKS`. It is what the placed-order report names, because it is what was billed.

`getPlanProductName` in the pricing reader is the one translation between them, and it is a choice of
_product_: the payments service derives the amount from a price identifier and accepts nothing that
could express "skip the trial".

## Location requests

**Location request**
: What a member creates when they ask someone where they are. It is either a request sent by SMS
to a phone number, or one shared as a bare link the member passes on themselves. Its status is
pending, located or refused.

**Consent link**
: The recipient-facing grant that belongs to a Location request. It is addressed by an opaque
token, never by the request's own id, and it has its own lifetime and its own state: active,
expired, or consumed. Its state never reveals whether a consumed link was answered or refused.

**Share link**
: The absolute URL that embeds a Consent link's token. The backend composes it; this application
never assembles one.

**SMS dispatch cycle**
: The rolling window the member's SMS dispatch counter and its limit belong to. Creating a
Location request costs nothing against it; dispatching an SMS does.

## Reverse-lookup reports

**Reverse-lookup report**
: What a member gets for a phone number they do not recognise. One record, created by one call and read
by another, and now created and read in **one** upstream: the new API, from both the member's
phone-lookup form and the public funnel's checkout.
[ADR 0027](adr/0027-the-reverse-lookup-creation-starts-on-an-unanswered-assumption.md) and
[ADR 0033](adr/0033-the-funnel-s-report-creation-follows-the-member-s.md) record the assumption that made
each half of that survivable and the symptom if it is false. The assumption still applies, but only
backwards: reports created before the funnel's cutover live in the legacy backend and are read from the
new API, so a report that does not open is diagnosed by its creation date.

**Report allowance**
: The rolling 24-hour window a member's report count and its limit belong to. Reading the count spends
nothing; creating a report does. The counter beside the form is decoration — the window is enforced by
the creation call, which refuses with a code rather than only a status.

**Report progress**
: How far a report has got. Three vocabularies describe it and **nothing translates between them**:

- the legacy backend's two — `pending` and `ready` — which are gone from this repository altogether:
  nothing read them, and the shape that carried them went with the funnel's creation call
  ([ADR 0033](adr/0033-the-funnel-s-report-creation-follows-the-member-s.md)). They are named here
  because reports created before that cutover still carry one;
- the new API's four — `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED` — returned at creation and meant
  to be polled for. Two of them are now read, and only far enough to tell "still preparing" from
  "ready": the sectioned read refuses while a report is `PENDING` or `PROCESSING`, and a `FAILED`
  report is a 200 whose sections are empty, which the report screen draws as a report that completed
  with nothing in it;
- the activity list's own four — `PENDING`, `LOCATED`, `REJECTED`, `READY` — which are not a report's
  states at all but the list's shared vocabulary across every kind of row it draws.

This entry exists so that whoever adds polling finds the mapping question already posed rather than
inventing a fourth vocabulary to avoid it.
[ADR 0028](adr/0028-the-report-reads-move-and-the-unlocks-stay-behind.md) settled part of what it left
open — the legacy pair is out of the reading path, and two of the new API's four are read for the first
time — and left the rest where it was: how the list's four line up against a report's is still the thing
to establish, not to assume. Designing the screen `FAILED` deserves, and polling progress from the
creation screen, remain the separate task ADR 0027 named.

**Section state**
: What one gated section of a report is doing, in the new API's vocabulary: `LOCKED`, `PENDING`,
`NO_RESULTS`, `RESULTS`. It is a section's word and not a report's — a report can be `COMPLETED` while
its social-media section is `PENDING` — and it is the term the report's three gated sections now use in
place of the legacy `reverse_lookup_*_upsell_purchased` booleans. `LOCKED` drives the unlock prompt,
`PENDING` drives the in-progress presentation, and the other two drive content.

The sex-offender section states it per owner rather than per report, which is why it also carries the
list of owners the member has unlocked. And a section's state is **read from the new API while the
unlock that changes it is still written to the legacy backend** — the asymmetry ADR 0028 records,
along with the symptom if the two upstreams do not share those records.

## The notification centre

Moved onto the new API by [ADR 0034](adr/0034-the-notification-centre-moves-whole-and-loses-eleven-languages.md),
which records what that cost and what it assumes.

**Notification centre**
: The member's list of what the product has told them, and the endpoints behind it — the list, the
**unread count**, and the write that marks notifications read. Its copy is composed _upstream_: a
notification arrives with a title and a body already written, in one of the two languages that
endpoint renders, so this application shows what the backend wrote rather than assembling a sentence
of its own. That is why moving it was not a change of client alone.

**Unread count**
: How many notifications the member has not read, as the centre's own endpoint answers it. What the
header badge shows on every member-area screen — which is why the dedicated endpoint is read rather
than the same number that arrives on the list response's `meta`, available only where the list is.
It falls when the screen marks notifications read, and it is not set to zero locally: notifications
behind the cursor are unread and uncounted here.

**Notification target**
: What one notification is _about_: a record's id together with its type, out of an enumeration the
API shares across families. It is the only thing on a notification that says where its row leads, so
it decides the destination and the icon together. Two of its types name a screen this application
has; a notification carrying any other type, or none, is a row that shows its copy and does not
open — the backend adding a type is part of the contract, not an anomaly.

## What is switched on

Introduced by [ADR 0020](adr/0020-one-answer-to-what-is-switched-on.md), which records why there
is one answer rather than three.

**Settings**
: What is switched on for one request, and where the person making it is asking from. Settled on
the server before anything renders, and true for the whole of that request. Three sources feed
it — the flags the API publishes, this application's own configuration, and the **override
cookies** — and a screen is not told which fed which: it asks whether a thing is on, not where
the answer came from.

**Flag**
: One switch in the Settings, named for what it turns on rather than for the variable or the API
key behind it. A flag is declared because something reads it, or because a screen being rebuilt is
about to — a switch the API publishes that nothing will ask about is not a flag in this codebase.

**Override cookie**
: A cookie that answers for a flag instead of its source. It has three states where a source has
two — on, off, and absent — and only the last defers to the source. It is how testing turns a
feature on where the configuration says off, and off where the configuration says on. Setting one
is not privileged: it changes what the person holding it is served, never what anyone else is.

**Country**
: Where the request is asking from — part of the Settings rather than a thing of its own. It comes
from the edge, and a development cookie can name a different one. It is a _value_ being
overridden rather than a switch, which is why its override is not an **override cookie**.

**QA widget**
: The panel that reads the settled Settings back and sets the cookies that change them, including
the ones the payments service honours. Turned on by configuration only — never by a cookie,
because it discloses the configuration to whoever opens it.

## The legacy surface and its retirement

Introduced by [ADR 0022](adr/0022-retiring-the-legacy-layer-on-its-own-track.md), which records why
this became a track of its own rather than a side effect of the redesign.

**Legacy surface**
: The set of calls this application still makes to the old backend, counted as distinct method-and-path
pairs rather than as call sites. It has no registry in the code — every path is a string written where
it is used — so the surface is only ever known by being counted. Shrinking it to nothing is the
condition for deleting the apparatus around it: the client factory, the browser hook, the server
getter, the unspecified proxy and the second host.

**Retirement track**
: Rewriting a legacy call because it is a legacy call, on its own schedule, independent of whether the
screen around it is being redesigned. Its unit is one endpoint, and its unit of completion is the
legacy wrapper being gone — not a new call existing beside the old one. It is the third part of the
programme of work, alongside the redesign and the wiring-up.

**Record ownership**
: Which upstream holds the record a call is about. Two endpoints can describe the same act in the same
words and still be about different records, and where that is true the pair is not a rename and cannot
be migrated as one. Ownership is a fact about the backends, so it is asked of them rather than inferred
here; two questions of this kind gate this track — whether the payments service observes a subscription
the legacy API created, and whether the new API and the legacy API share reverse-lookup report storage.
A record created in one upstream and read from the other is not a record.

**Gap**
: Something a screen needs that the new API does not answer — a family it does not model, or one it
models without publishing a response schema. A gap is recorded and reported upstream, never routed
around: a facade over the old backend would delete the legacy client by moving it, and the layer would
have to be removed twice. A gap is why a task on this track can exist, be fully specified, and still not
be startable.
