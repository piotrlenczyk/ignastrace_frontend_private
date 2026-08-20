# 0016 — The payments service is a second upstream, with its own client, proxy and specification

**Status:** Accepted — August 2026. Extends
[0009](0009-one-proxy-for-every-browser-call.md), which named "a second API with a second error
envelope" as the thing that would make its parser layer worth having; this is that case. It departs
from [0015](0015-the-proxy-refuses-session-issuing-paths-not-a-prefix.md) on how a proxy refuses a
path, for the payments door only — the record on the other door stands unchanged. Corrected on one
point by [0023](0023-a-shared-technical-account-for-the-payments-upstream.md): the credential the
payments door presents is **not** the session's own access token, because the deployment that answers
today did not issue it. Everything else here stands.

## Context

Payments do not live on the new API. Subscriptions, products, prices, transactions and every payment
provider integration are a separate service with a specification of its own, and the application now
has to read and write them from both halves of itself: server components need product and
subscription data, and the checkout screens need to start, confirm and cancel a payment from the
browser.

**Nothing about the existing data layer covers a second backend.** Record 0009 is written throughout
as though there were one: one generated specification, one typed server-side client, one catch-all
proxy carrying the browser's calls, one error envelope with one parser behind an unwrap function. It
left room for exactly this — the parser interface and the parser manager were kept, against the
argument that a single function would do, on the grounds that a second API with a second envelope
would need them back — but it left no answer for how the second upstream is wired.

**The payments service differs from the API in the three ways that make the answer non-obvious.**

_Its paths are unrelated and unprefixed._ It publishes `/products`, `/subscriptions`, `/users` — bare
nouns, with its own `/api/payments/v1` prefix in the specification's `servers` field rather than in
its path templates. The API's paths are versioned and prefixed. Nothing distinguishes one
specification's path from the other's by shape, and one of them owns the shortest, most generic names
in the vocabulary.

_It authenticates user traffic with a cookie and nothing else._ Its specification declares three
security schemes: a cookie holding the access token, and two bearer schemes — one for Okta, one for a
support-automation bot. There is no user-facing bearer. The token this application already holds in
its sealed session is accepted, but only if it arrives as a cookie.

_It declares no failures._ Every operation in the specification answers with a 200 or a 201 and
nothing else. What it actually refuses with is its framework's default — a message and the status
restated in the body — observed rather than promised, and unrelated to the API's envelope of a nested
error with a name and a code.

**And half of it is not a browser's business.** Of the seventy paths the specification publishes,
forty-five are back office: product and price configuration, rate-limit administration, routing rule
sets, other services' internal endpoints, support automation, provider webhooks authenticated by
signature, and chargeback handling by provider identifier. Record 0015 decided how the API's proxy
refuses a path — an enumerated, hand-read list of path templates — on a refused set of seven, six of
them named for the token pair their bodies hand back and the seventh for enumerating accounts, on a
subtree that is otherwise stable. None of those three conditions holds here.

**The host is not even the right host yet.** There is no Ignastrace payments instance. The only
deployment that answers today is the resumewise development one, which is where the specification was
fetched from and what every environment currently points at.

## Decision

**The payments service is a second upstream, wired the way the first one is, and separately.** It
gets its own generated specification, its own typed server-side client, its own proxy under its own
mount, and its own browser query client. Each is written out rather than parameterised over the
existing one.

**Two clients, neither able to serve the other's paths.** A server component or server action reads
payments through the payments server client and the API through the API's; the types refuse the other
upstream's path literals, which is the point of there being two objects rather than one client with a
second base URL. The same holds in the browser: two query clients, each generic over one
specification, so a call site cannot reach for a path the upstream it is talking to does not publish,
and neither specification lands in the other's bundle.

**A proxy of its own, at a mount of its own, with the upstream path mounted verbatim.** The mount
comes off and what is left is the service's own path, unchanged — which is record 0009's load-bearing
decision, kept for the same reason: because the path survives the hop, a generated path literal
describes both sides of it and a browser call is typed end to end. The browser client's base URL is
that mount and nothing more, so the prefix the handler strips is the one the client added.

**The proxy attaches the session's access token as the cookie the service authenticates with.** This
is not a stylistic difference from the API door — the header that door sets is not read by this
service at all. A browser-supplied `Cookie` is discarded on the way up, exactly as a browser-supplied
`Authorization` is on the other door, so the session's token is the only credential that can be
presented. `Set-Cookie` does not come back down, least of all for the cookie the service
authenticates with. A call with no session goes out with no token, because unauthenticated is a
normal case here: public pricing is read before anybody has an account.

**A caller's market travels with the request, and QA overrides travel as cookies.** The service picks
prices and payment providers per market, so the caller's address and country are attached
server-side under the names the edge in front of this application already uses, neither of which its
specification documents. It also honours a small set of cookies that pin the provider, the trial
length and the split-payment settings; those are set in this origin under a reserved prefix, selected
by that prefix, stripped of it, and merged onto whatever `Cookie` the request already has rather than
substituted for it — so pinning a provider never signs the caller out. The one exception to the
prefix being the whole rule is that a cookie which would strip to the credential's name is dropped:
these overrides are settable from the browser by design, and without that exception a page script
could name the very credential the proxy exists to keep out of its hands.

**The shared error envelope is widened with a source discriminator rather than split in two.** One
flattened error type still describes every refusal the application can receive, and it now carries
which upstream refused. A parser per upstream brings each service's own envelope to it, and the
manager tries them in order. Three fields follow from the second envelope: the service's own code is
optional, because this service publishes none; the restated status is a string that is a name for one
upstream and digits for the other, and which it is follows from the source; and the source itself is
what identifies parsed data on the client, where an action's failure arrives as a plain object that
has forgotten its class. No service sends the source, so its presence is a stronger claim than any
field an upstream body could satisfy by coincidence.

**The payments proxy refuses back-office path families as patterns, a deliberate departure from 0015.**
That record replaced a prefix rule with an enumerated list of refused path templates, and gave a
good reason: a security boundary that appears and disappears with a regeneration is harder to
reason about than one read in the file that enforces it. **The same reasoning gives the opposite
answer here**, for three reasons that are all differences in the situation and not in the principle.

_The refused set is most of the specification, not a corner of it._ Forty-five templates of seventy,
which is a list nobody checks by reading, and record 0015 named exactly that — "a refusal list long
enough that reading it stops being how someone checks it" — as what would make its own decision worth
revisiting.

_The refusals are a category, not an enumeration._ Everything refused here is refused for being back
office: administration, other services' internals, support automation, provider webhooks, chargeback
handling. Record 0015's refusals were an enumeration precisely because its subtree had stopped being
uniform — one operation under the authentication prefix had nothing to protect, and a prefix rule got
it wrong. There is no such operation in these families. A browser has no business in any of them,
whatever the specification adds.

_The set turns over._ These are the parts of a payments service that change most often, and each
regeneration would otherwise open a window between an endpoint appearing upstream and somebody
noticing it in the list. The families are therefore checked before the allow-list, so a back-office
path is refused as forbidden whether or not the specification publishes it today. The family is
compared against the first segment as a prefix, so a rename that pluralises one — the chargeback
family is published in the plural today — stays refused.

**The payments host is temporarily a resumewise instance, and the deployment documentation says so.**
The base URL, prefix included, is an environment variable in every environment, and every environment
currently points at the resumewise development deployment, because it is the only payments instance
that answers. When an Ignastrace instance exists, the change is that variable's value and a
regeneration of the specification against the new host — no code, unless the two instances turn out to
publish different paths or a different envelope, in which case this record's parser is where the
difference lands.

## Alternatives considered

**Fold payments into the existing specification and reach it through the existing client and proxy.**
One client, one door, one allow-list. Rejected on all three axes. The specifications are unrelated and
the payments paths are the generic ones — a single client generic over both would let a call site pass
`/users` and be typed, without either the compiler or the reader knowing which service answers it, and
a single door would have to guess which upstream a path belongs to from the path alone. It would also
put both specifications in one bundle, and it would mean one credential rule serving two schemes.

**Generalise the existing proxy into a factory the two doors share.** Attractive on a first read:
both doors strip a mount, check a path, forward headers by allow-list and return the status and body.
Rejected because they differ in what they refuse, in the envelope they refuse in, in the methods
their specifications declare and in the credential they attach — four parameters, at which point the
factory is a harder thing to read than either door. It is also a change to the module this work was
asked to leave alone, which is a poor way to introduce a second upstream.

**Send the session's token to payments as a bearer.** Rejected because it is not a scheme the service
offers to a member: its bearer schemes are Okta's and the support bot's, and its cookie is the only
user-facing one. This was not a preference between two working options.

**Give payments its own error envelope type, separate from the shared one.** Two unrelated parsed
error types, each with its own unwrap. Rejected because the point of the layer 0009 kept is that a
call site reads a refusal one way whatever refused; two types would push the branch out to every
form that touches both upstreams, which the checkout screens do. The source discriminator is the
smaller change and the one the parser manager was left in place for.

**Let the payments parser recognise its envelope without a source field, and infer the upstream from
the path.** Rejected: the manager is shared and is told by neither client which one is asking, and a
path is not available where an action's failure is read. The discriminator is stated by the parser
that produced the data, at the only point where the answer is actually known.

**Enumerate the refused payments paths, as record 0015 does for the API.** The consistent choice, and
it was weighed as such. Rejected for the three reasons above — the list is forty-five long, the
refusals are a category, and the set regenerates — and the cost of departing is recorded in the
consequences below.

**Derive the refusal list from the specification during generation, for both doors.** Still the
eventual answer for the API's list if that list ever becomes a category. It does nothing for this
door: the specification does not mark an operation as back office, so what would be generated is the
family match written out longhand, and re-derived on every regeneration.

**Wait for an Ignastrace payments instance before building any of this.** Rejected because the
service is the same service and the specification is the one it publishes; what is provisional is a
hostname in an environment variable, which is the cheapest thing in the layer to change.

## Consequences

**There are now two of everything in the data layer, and which one a call uses is a decision at every
call site.** A contributor reading a screen has to know which upstream owns products and which owns
profiles. The types enforce the answer once the client is chosen, and choosing the wrong client is a
build failure, not a 404 — but the choice is real and the project's own instructions have to name it,
which is why they now do.

**The two doors refuse paths on different principles, and that is a documented departure rather than
drift.** Someone unifying them later will find one door with an enumerated refusal list and one with
matched families, and the reasoning for each is in the record for that door. Refusing to notice the
difference is how it becomes drift.

**A back-office endpoint added upstream is refused without anyone acting, and so is a browser-facing
one added inside a refused family.** The second half is the cost: an operation the browser legitimately
needs, published under a name beginning with one of the refused families, is unreachable until the
family list is reconsidered. That is the mirror image of 0015's cost, which is that a token-issuing
operation is relayed until someone writes it down, and it is the safer of the two failures.

**The specification's own error types describe nothing, so a payments failure is only ever what the
parser observed.** The generated types promise a 200 or a 201 for every operation. A call site that
wants a payments refusal in the shared envelope gets it from the parser, and a browser hook's
`onError` sees the service's own body — the same bargain the API's hooks already make.

**A body of the payments shape is labelled as the payments service's, wherever it came from.** The
manager is shared and told by neither client which upstream it is reading, and a message with a
restated status is a framework default that a gateway or a middlebox in front of either upstream can
answer with. The API's parser is tried first, because its guard describes an envelope a service
promises where the other describes a default anything might produce. Narrowing this further means
telling the manager which client is asking.

**Every payments environment points at another product's development deployment.** Rate limits, data
and availability are that instance's. This is temporary by construction, and the same note sits
beside the variable wherever it is set — the example environment, the deployment documentation and
the chart's values — rather than only here. Those are the places a cutover touches, and there is no
code among them.

**The refusal the door writes is in the payments service's envelope, not the API's.** A refusal by
the door and a refusal by the service behind it are read by one parser, and the door adds a code —
which the service publishes none of — so a call this application turned down is tellable from one the
service turned down.

## What would make this worth revisiting

**An Ignastrace payments instance.** The variable's value and a regeneration; this record's
temporary-host section stops applying, and if the two instances differ in what they publish, the
diff lands in the generated specification and the path families.

**A browser-facing operation published inside a refused family.** The one failure mode the family
match has. It would need either a narrower family, an exception beside the list — which 0015 rightly
argues against — or the generated derivation both doors have now declined once.

**The payments service publishing its failures.** The parser exists because the specification
declares none. A declared envelope would move that shape from observed to promised, and would let the
generated types describe a refusal the way they describe a success.

**The payments service publishing a user-facing bearer.** The cookie is used because it is the only
scheme offered to a member. A bearer would make the two doors attach the same credential the same
way, and would remove the one asymmetry between them that is not about paths.

**A third upstream.** Two of everything is a pattern; three is a case for the factory rejected above,
with four parameters now justified by three callers rather than two.
