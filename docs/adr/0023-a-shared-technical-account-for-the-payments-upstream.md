# 0023 — A shared technical account is the payments credential, until the upstream trusts ours

**Status:** Accepted — August 2026. Temporary by construction. Completes the half of
[0016](0016-a-second-upstream-with-its-own-client-proxy-and-specification.md) that record did not
anticipate: it settled that the payments door attaches the session's token as a cookie, and noted
that the host is temporarily a foreign one. Those two sentences do not hold together, and this record
says what is presented instead. It changes nothing in
[0008](0008-a-sealed-session-on-the-new-api.md), [0009](0009-one-proxy-for-every-browser-call.md) or
[0012](0012-the-session-through-iron-session-s-own-api.md) about who the member is or how that is
established.

## Context

**Nothing the payments upstream protects can be served to a signed-in member.** The service
authenticates one by a cookie holding an access token, and this application fills that cookie with
the token pair the new API issued. The only payments deployment that answers today belongs to another
product; it did not mint that token and does not recognise it. Public pricing works, because the
product catalogue declares no security at all. Everything user-facing — the member's own products,
their subscriptions, their transactions, their profile, every checkout write — is refused before it
reaches any screen.

**This is not a bug in the wiring.** Record 0016 accepted a foreign host as a temporary measure on
the reading that the change, when an Ignastrace deployment exists, is a configuration value and a
regeneration. That reading is right about the _paths_ and wrong about the _credential_: a token is
only meaningful to the issuer's own trust domain, so pointing at a foreign deployment is not merely
addressing a different host, it is addressing a different set of accounts. No amount of correctness
in this application produces a credential that deployment will accept.

**And the screens are already built.** Subscriptions, billing transactions, the member's catalogue
and the checkout writes all read through the payments upstream now. They are not blocked on design or
on an endpoint; they are blocked on one credential that no part of the system can currently present.

## Decision

**One shared technical account on the payments upstream is the credential, seeded from
configuration.** The session carries a second token pair alongside the API's — an access token, its
expiry, and a refresh token — and the payments door presents that pair, and only that pair, as the
cookie the service authenticates with. The API pair keeps doing what it already does: it says who the
member is, and the guards keep deciding what a session may see.

**It is the same account for every member, and there is no environment gate.** Wherever the
configuration is present the arrangement is active, production included; absent configuration is the
only thing that switches it off, and it switches it off by leaving payments calls unauthenticated —
which is exactly what a visitor without a session already sends. We take this knowingly: on a
configured environment, every member's payments calls are made as one account, so the per-member
payments paths return, and can act on, that account's data.

**Renewal is lazy, in the session step of the middleware chain, as a second and independent
branch.** Where the existing branch acts when the API access token has run out, this one acts when
the payments access token is absent or past its expiry — on page requests and route-handler requests
alike, because the payments door is a route handler and needs the credential as much as a page does.
Both pairs are sealed once, into the one session cookie, and applied to the request as well as to the
response, so the steps that follow read what was just renewed.

**Configuration is a seed, not the credential.** The renewal spends the session's refresh token when
it holds one and the configured one when it does not, and keeps the rotated token in the session from
then on. An empty field therefore means "seed again", which is what lets a rotation that was lost
repair itself on the next request.

**Expiry comes from the token's expiry claim and nothing else.** No identity claim is read, because
this account is not the member. A token that will not decode, or that carries no expiry, counts as
already expired and is logged — the alternative seals an expiry that every comparison reads as still
valid and pins the session to a dead credential.

**A refused or unreachable renewal clears the credential and the request carries on.** The API pair
is untouched, the member stays signed in, an incident is logged, and the payments call goes out
unauthenticated. A foreign system's outage is not a sign-out.

**The renewal is a bare request in one module, not a third upstream.** One hand-written call to a
configured URL with a hand-written response type: no generated specification, no third client, no
proxy — the browser never makes this call. The contract is assumed to be the API's own renewal
operation, on the reading that the two backends share an origin. Host and path are one configured
value and the two response fields are read in one place, so a wrong assumption is corrected by
configuration or by two lines.

**Two configuration values, both optional, in the payments family.** One names the renewal endpoint,
one carries the seed refresh token. The writes that mint a session are not changed and do not learn
about any of this.

**Named after what it is for, not where it came from.** The fields, the module and the variables say
_payments_, not the name of the product whose deployment currently answers. The names survive the
upstream being replaced; the temporariness is carried here and in the module's own comments.

## Alternatives rejected

**A process-wide cache of the one account's credential.** The account is shared, so a single
in-process pair would be the obvious economy: one renewal serves every request, and the session never
grows. Rejected because it puts a credential in module state that outlives the request, in a runtime
that is horizontally scaled and can be recycled at any moment — so it needs a lock, an invalidation
story and a reasoning-about-lifetimes that a sealed cookie already has, all for a thing built to be
deleted. Keeping it in the session also means one place holds credentials, and one place empties when
a member signs out.

**A per-member identity on the payments upstream.** Registering or signing each member in over there
is the _correct_ shape and the one this is standing in for. It is not available: nothing in this
application may create accounts on another product's deployment, and doing so would leave real
records behind on a host that is about to be replaced.

**An environment gate — a flag, a settings field or a production check.** Rejected because it is a
second switch for one thing. Configuration presence already decides it, and a gate would make an
unconfigured production environment behave differently from an unconfigured development one for no
reason anybody could read off the code.

**A third full upstream: a generated specification, a client and a proxy for the renewal.** One POST
that the browser never makes does not earn any of that, and each piece would be another thing to
delete.

**A timeout and back-off on the renewal.** Rejected knowingly, and this is the sharpest cost here:
while the payments upstream is silent, every request retries and every render waits on it. Adding a
budget and a circuit breaker is real work with real tuning, on a code path whose removal condition is
already written down. If the outage is the common case rather than the exception, that is the signal
to remove the arrangement, not to insulate it.

**De-duplicating concurrent renewals**, for either pair. Two requests renewing at once can still
invalidate each other's refresh token. That is the same knowingly-unguarded case record 0008 records
for the API pair, and it is not made worse by there being two.

## Consequences

- **A signed-in member is served by the payments upstream at last** — their subscriptions, their
  transactions, their catalogue, and a checkout that does not fail at the credential.
- **Every member's payments data is one account's data on a configured environment.** This is the
  price of the decision, not a side effect of it, and it is why the removal condition below matters.
- **One account's refresh token exists as N per-session copies**, and two sessions renewing together
  can invalidate one another. The seed repairs it on the next request, at the cost of a round trip.
- **A payments outage makes every request wait**, with no timeout and no back-off.
- **The browser is no more able to name a credential than before.** It holds no token, the door still
  discards the `Cookie` it sends, and the override cookies still cannot strip to the credential's
  name.
- **Removal is a deletion, not a refactor:** three session fields, one module, one branch of the
  session step, one line in the payments client, two configuration values and this record's status.
  The condition is a payments deployment that trusts the new API's tokens.
- **An operator can switch it off ahead of the deletion** by unsetting either variable. A credential
  a previous configuration left in a session is dropped on the next request rather than kept alive.
