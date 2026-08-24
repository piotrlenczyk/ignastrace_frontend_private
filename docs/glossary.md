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
: The commercial relationship — whether a subscription was ever bought and what state it is in,
what has been paid, what extras are owned, what a member has asked to be notified about. It is
_not_ part of the account, no endpoint publishes it, and every screen that gates on it currently
reads a fixture.

**Member**
: The account and the membership seen as one object, which is the shape every screen in the
member area reads. It exists because the legacy call answered in that shape and a dozen screens
were written against it; it is composed rather than fetched.

**Subscription status**
: The funnel's vocabulary for where a member stands: never bought, incomplete, active, cancelled
but still running, expired. The gating decisions are expressed in these terms — no subscription
sends someone to checkout, an ended one sends them to billing.

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

**Upselling**
: **Two different things, and they do not map onto each other.**

In the funnel, an upselling is one of seven product keys held as a list on the member — the
extras someone bought alongside the subscription. Owning one is what lets a report screen
unlock the corresponding section, and having any at all is what sends a member past the upsell
offer instead of into it.

In the new API, an upselling is a per-product **credit balance** over three products on an
endpoint of its own: how many of a thing a member may still spend, not which things they own.

There is no one-to-one translation between the two, and adopting the second means remodelling
the report and upsell screens rather than renaming a field. The single overlapping concept is
**unlimited PDF downloads**, which the new API publishes as a boolean entitlement on the
current-user response — the one commercial fact the account service does answer.

**Purchase information**
: What a member paid and what they may still spend: the trial price, the total, what the extras
came to, and a flag per extra saying whether there is anything left to spend on it. The prices
are what the thank-you and upsell screens report to analytics; the flags are what the report
screens unlock on.

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
