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
