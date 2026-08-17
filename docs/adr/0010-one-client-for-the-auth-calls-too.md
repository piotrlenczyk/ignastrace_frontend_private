# 0010 — The authentication calls go through the generated client too

**Status:** Accepted — August 2026. Reverses the "renewal cannot use the ordinary server-side API
client" consequence of [0008](0008-a-sealed-session-on-the-new-api.md), and extends
[0009](0009-one-proxy-for-every-browser-call.md)'s typed-client rule to the last layer that was
exempt from it. The interim recorded in the "forms still see what they saw" consequence below is
over, settled by [0011](0011-auth-failures-on-the-standard-action-error-channel.md). The
current-user call this record introduced to complete an identity is removed by
[0012](0012-the-session-through-iron-session-s-own-api.md), which also moves each auth request out
of the session module and into the write that makes it; the client rule itself stands.

## Context

Record 0008 built the session on the new API and left one exemption behind: the calls that mint,
renew and revoke a session were hand-written requests over the platform's own fetch, with
hand-written request and response types beside them and a bespoke error class carrying nothing but
an HTTP status. Record 0009 then routed every browser call through a typed client and made "typed
against the generated specification" the rule for new work. The authentication layer stayed as it
was, and it was the only place in the application still describing the API by hand.

**The reason given for the exemption does not hold.** It was that the ordinary server-side client
resolves the caller's address through a helper needing a request scope the middleware runtime does
not have, so a client used from the middleware would fail there. Three things are wrong with it.
The sibling codebase this project was duplicated from calls the same generated client from its own
middleware, on the edge runtime, in production. The values that need a request scope can each be
read behind a guard at the point they are used rather than resolved when the module loads, which
turns a missing scope into a fallback instead of a failure. And a caller that has no scope but does
know the answers — the middleware reads the locale and the forwarded address off the incoming
request — can state the headers itself, provided the client leaves a header the caller already set
alone.

**The exemption had a running cost.** Two descriptions of the same request and response bodies, so
a field renamed upstream was a runtime failure on the authentication path and a build failure
everywhere else. A second failure vocabulary for one layer, which every reader of that layer had to
learn. And the API's error envelope — with the stable error-code enumerations the specification
declares — discarded at the moment of failure, leaving a numeric status as the only thing a form
could branch on.

**The one open question was whether the generated client can be bundled into the middleware
runtime on this project's framework major**, since the sibling proves it only on the previous one.
It was settled by building it: the client, its fetch layer and the shared response unwrapper all
appear in the middleware chunk, and the build succeeds.

## Decision

**One client for every call the application makes to the new API, authentication included.**
Sign-in, registration, renewal, sign-out and the single identity top-up at session creation are
issued through the same generated, typed server-side client every server component and server
action already uses, and their responses are read through the same unwrap. The hand-written request
module, its hand-written types and its bespoke error class are deleted. There is one description of
what the API accepts and returns, and it is generated.

**Every header the client attaches is caller-wins.** A header already on the request is left
exactly as it is. This is what makes the two awkward cases ordinary rather than special: a
token-exchange flow can present a credential other than the session's — renewal presents the access
token that has just expired, because the operation declares bearer authentication and this
application configures no API key — and a caller with no request scope can supply the locale and the
forwarded address itself.

**Each request-scoped value is read at its point of use, behind a guard, and has a fallback.** The
session's bearer, the caller's address and the locale being served are resolved when a request is
actually being built, not when the client's module is first loaded, and a failure to resolve one
means that header is omitted or takes a default rather than that the call fails. That is what makes
one client usable from the middleware runtime and from a request scope alike, and it is load-bearing
— collapsing those reads back to module scope reinstates the problem this record reverses.

**A refusal from an authentication endpoint is the application's standard API error.** It carries
the API's own envelope — its error code, its status name, its message — and the response it arrived
in, exactly as a refusal from any other endpoint does. Nothing about authentication needs a failure
type of its own.

**The identity top-up keeps swallowing a refusal, and is the only call that does.** It runs while a
session is being assembled out of a pair the API has just issued, and what it answers is "here is
the identity the token's claims did not carry, if there is one". An incomplete identity is a
decision for the caller — which declines to seal a session it cannot name a user in — not a failure
to raise. It reads its response through the same unwrap as everything else; it just declines to
propagate what that unwrap rejects with.

## Alternatives considered

**Keeping a second, minimal client for the middleware runtime**, as 0008's consequence anticipated.
This was the fallback if the bundling question had gone the other way, and it is what the current
code approximates. Rejected because the question went this way: two clients against one API means a
change to outgoing headers has two places to land, and the layer that most needs its contract
checked is the one that would keep describing the contract by hand.

**Keeping the bespoke error class and mapping the generated client's failures into it.** That
preserves the existing status-based branching in the operations for free. Rejected because the class
exists only to carry a status the standard error already carries on the response it holds, and
because the envelope it would go on discarding is the thing worth having.

**Suppressing the session's bearer on sign-in and registration.** The client attaches it when a
session happens to exist, and neither operation needs it — registration's specification declares it
as an optional guest-conversion credential, a flow this application does not have. Rejected as
noise: leaving it means every call site states nothing about a header no call site cares about, and
"the client attaches the token, no call site remembers to" is the rule worth keeping unbroken.

## Consequences

**A change to the API's authentication contract now fails the type check.** That is the point of
the record, and it is the one thing the exemption cost that could not be worked around.

**Renewal presents a credential it did not present before.** The hand-written request sent no
authorisation header at all; the generated call states the session's expired access token, because
that is what the operation declares and what the sibling codebase sends. An API that rejects an
expired bearer outright rather than ignoring it would refuse a renewal it previously served. This
follows from reading the specification rather than from this record's structure, but it is a live
behavioural change and not a refactor, and it is worth confirming against a deployment.

> **Settled by [0011](0011-auth-failures-on-the-standard-action-error-channel.md).** The interim the
> paragraph below describes is over: the outcome objects are gone, a refusal propagates as the
> standard error all the way to the form, and a form branches on the API's error code. The
> envelope-less refusal it flags still degrades — it now arrives as the generic failure rather than
> as a status-derived guess.

**The forms still see what they saw.** The two operations that answer their callers with an outcome
object rather than by raising keep doing so, and they read a status off the standard error to choose
between their existing reasons. That is an interim: the envelope now survives as far as the
operations, and carrying its error code the rest of the way to a form is a separate decision with
its own record. Until then, a refusal whose body is not the API's envelope — a gateway's HTML, a
connection that never opened — has no status to read and is treated as unavailability, where the
hand-written layer would have read the status off the response and called a 401 a credentials
problem.

**Nothing in the authentication layer is exempt from the data-layer rules any more.** A new
authentication endpoint costs a regeneration and a call, the same as any other endpoint, and the
two claims that justified the exemption are gone from the code along with the code they justified —
so there is nothing left inviting the next reader to reinstate the workaround.

**A test of an authentication path has to substitute the network before the client's module runs.**
The client captures the platform's fetch when it is created, so a substitution installed per test is
never the function it calls. The tests on these paths install one for the file and swap what the API
answers with — which is a better test in any case, because it asserts against the request that
actually left the process rather than against the arguments a helper was handed.

## What would make this worth revisiting

**The framework's middleware replacement, which forces the whole chain onto a server runtime.** The
bundling question this record settled becomes moot there, and one client remains correct — but the
verification behind it is specific to the runtime the chain runs on today.

**An API key becoming configured for this application.** The renewal's choice of credential is
forced by there being exactly one credential available; with two, the operation's declared
alternative is a real choice and the expired-bearer consequence above goes away.

**A second backend, or a second error envelope.** Both are the cases the parser layer behind the
unwrap was kept for, and neither changes which client issues an authentication call.
