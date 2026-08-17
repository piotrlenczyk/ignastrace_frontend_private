# 0009 — Every browser call goes through this application's own server, and arrives typed

**Status:** Accepted — August 2026. Supersedes the second-cookie section of
[0008](0008-a-sealed-session-on-the-new-api.md).

## Context

Record 0008 moved the server half of the application onto the new API: a sealed session cookie
holding the token pair, renewal in the middleware, and a generated, typed client for server-side
callers. The browser half was left where the inherited codebase had it, and it held three separate
problems.

**The access token was readable by any script on the page.** A second, deliberately non-http-only
cookie carried the raw token, because client code needed a bearer to call a backend directly.
Twenty-nine hook modules read it through a shared client. Any injected script on any page could read
the same cookie and impersonate the member for as long as the token lived. That was a considered
trade in 0008 — the short-lived half exposed, the half that mints new sessions sealed — but it is
still a credential sitting in reach of every third-party tag the site loads.

**Browser calls were untyped.** The generated types cover all forty-four of the new API's paths, and
only server-side code could use them. The browser client was a hand-written wrapper over `fetch`
taking a path string and an untyped body, returning whatever the caller asserted. A field renamed on
the backend was a runtime failure, not a build failure.

**There was no convention for writing to the API.** Sign-in, registration and sign-out were server
actions returning hand-rolled result objects; everything else was a hand-written mutation hook in
the browser. A contributor adding a feature had no answer to "where does this call go?", and the
project's reference implementation — the sibling `resumewise-frontend` repository — answered it
differently from anything here.

These are one problem in three faces. Closing the token means the browser cannot call a backend
directly; not calling a backend directly means something in this application must forward the call;
and once a forwarder exists, what it does to the path decides whether the generated types are worth
anything to the browser at all.

## Decision

**Every request the browser makes goes through this application's own server, and nothing else
changes about who may call what.**

**Two proxies, both catch-all route handlers under this application's own API namespace.** A
_proxy_ here means a route handler that accepts a call from the browser, attaches the session's
bearer server-side, forwards it to a backend, and returns the upstream status and body. One proxy
serves the new API; a second, simpler one serves the legacy backend. Neither requires a session — a
request without one is forwarded anonymously and the backend decides, because the anonymous funnel
flows depend on it and moving that decision into the proxy would create a second code path for
them.

**The upstream path is mounted verbatim.** The new API's proxy reconstructs the path from the
segments it receives and forwards it unchanged: no prefix is stripped, nothing is rewritten. This is
the load-bearing decision of the whole record. Because the path survives the hop, the generated path
literals describe both sides of it, and a browser call can be typed end to end — path, request body,
response and error — from the same specification the server uses.

**Path validation comes from a generated list.** The build that generates the API types emits a
second output beside them: the specification's path templates. The proxy compiles those to matchers
once and refuses anything that does not match. A new backend endpoint therefore becomes reachable by
regenerating, not by a second manual edit that someone will forget.

**The proxy refuses the authentication endpoints outright.** Everything under the API's
authentication prefix is answered with a refusal. Minting, refreshing and revoking a session stay
server-only flows owned by the session module; a page script cannot reach them through the door this
record opens.

**Headers travel by allow-list in both directions.** Upward: the locale, content type and accept
headers the browser sent, plus the `Authorization` the server-side client attaches from the sealed
session. An `Authorization` supplied by the browser is discarded, never forwarded, so a caller
cannot present a token of its own choosing. Downward: the status and the content type only — never
`Set-Cookie`, so a backend cannot write cookies into this origin. The legacy proxy is stricter
still and returns no headers at all.

**The query string is forwarded verbatim** rather than parsed and re-serialised. The browser client
is configured with the same query serialiser as the server-side client, so what arrives is already
correct; re-serialising is how repeated keys and array parameters get mangled.

**A request body is read as JSON; a success body is not read at all.** The specification declares no
non-JSON request anywhere, so a body that is not JSON is refused rather than forwarded as something
the API cannot parse. In the other direction the body is left as a stream, so what the API sent is
what the browser receives, byte for byte.

**Error bodies come back with the upstream status and their fields intact.** That is what lets the
generated error types describe what a browser call receives, and what lets one parsing layer serve
both sides of the hop. A refusal is the one body that is re-serialised on the way through — the
client reads it as text before the proxy sees it, whatever the proxy asked for, so the fields
survive and the upstream whitespace does not. The proxy's own refusals are written in the API's
error envelope for the same reason: one parser reads everything the browser can be handed. There is
no global handler for an expired session — each call site decides what a dead session means for it.

**The error layer is ported from the reference repository as it stands there**, including the parser
interface and the parser manager, rather than collapsed into the single function this API's one
error envelope would need. Callers do not touch either: they use one _unwrap_ function that takes
the client's result and returns data or rejects with an error object carrying the parsed fields and
the response. The legacy backend keeps its own, unrelated error type — the two vocabularies do not
merge.

**Browser calls are typed queries through the proxy.** A second generated client, pointed at this
origin so that a specification path literal resolves onto the proxy, is wrapped in
`openapi-react-query`. It attaches the locale header itself, read from the document's language
attribute, because the server-side locale getter has no request scope inside a route handler and
would otherwise report English for every call the browser makes.

**Writes are server actions when they must touch a cookie, redirect, or invalidate the framework
cache** — sign-in, sign-out, registration, and anything of that shape. Everything else is a query
mutation through the proxy. Server components keep reading directly through the server-side client,
with no prefetch and no hydration boundary. After a mutation, invalidation is explicit at the call
site: query keys for client-held data, and a router refresh only where the change is visible in
server-rendered output. Actions are built on `next-safe-action`, on a single action client that maps
a parsed API error to a structured action error, so a failure arrives at the form as data rather
than as a thrown exception.

**The readable access-token cookie is gone.** With no browser code needing a bearer, it is no longer
written, and the helper and constants that described it are deleted. The session is one sealed,
http-only cookie. Client components read identity — never a token — from a session provider the root
layout renders out of that cookie, alongside the consent, country and feature-flag providers already
there. Sign-in, registration and sign-out revalidate that layout so the provider re-renders with the
new identity.

**Legacy stays, behind its own proxy.** The legacy server helper, the legacy client and the
twenty-nine hooks that use it are unchanged except for one edit: the browser-side legacy client
points at the legacy proxy and stops attaching a bearer. That proxy validates no paths, because
there is no specification for that backend to validate against; the single configured host is what
bounds it. Removing the readable cookie and leaving legacy untouched look incompatible — the legacy
browser client read that cookie in twenty-nine places — and the legacy proxy is what makes both true
at once, at the cost of one route handler that will be deleted with the layer it serves.

**New code may not import the legacy clients.** The legacy layer dies screen by screen, with the
screen it serves, as that screen is redesigned. Nothing new joins it.

## Alternatives considered

**One route handler per endpoint, as the reference repository does.** `resumewise-frontend` writes
around thirty of them, each restating the same forward. This is the one deliberate departure from
that repository, and it is what makes the typed query layer worth having: the types survive the hop
because the path does. Per-endpoint handlers would either restate every path type by hand or reduce
the browser to the same untyped strings it had before, and thirty near-identical files drift.

**Collapsing the parser interface and the parser manager into one function.** This API has a single
error envelope, so a single function would do everything the layer currently does, and the interface
plus the manager look like ceremony next to it. It was kept because the reference repository has it,
and because the sibling repositories are meant to be legible to the same people; a second API with a
second envelope arriving later would have to reintroduce exactly this. **This is a choice, not an
oversight — do not "simplify" it without deciding that the repositories may diverge here.** Where
there was no such reason to differ, this follows the reference repository throughout.

**Importing the specification document at runtime to validate paths.** Rejected: 173 KB of server
bundle to obtain a list of forty-four strings, which the generator can emit as a typed constant that
cannot drift from the types beside it.

**The reference repository's version 7 of the action framework.** Version 8 is used instead, because
8 sits on Standard Schema and therefore works with the Zod 4 this repository already has. Matching
the sibling's version would have meant downgrading a validator used everywhere.

**Re-serialising the query string in the proxy** — rejected above; it is how repeated keys break.

**A global handler for an expired session on the client, and prefetching browser queries on the
server.** Both were left out. The first hides a decision each call site should make; the second is a
per-screen judgement, and a screen that needs a hydration boundary can gain one without this record
changing.

**Keeping the readable cookie and skipping the legacy proxy.** That leaves the token in reach of any
injected script for as long as the legacy layer lives — which is the length of the redesign, not a
sprint.

## Vocabulary

No glossary document is introduced for this layer; these are the words, defined here.

**Proxy** — a route handler in this application that forwards a browser call to a backend with the
session's bearer attached server-side. There are two: one onto the new API, path-validated against
the generated specification, and one onto the legacy backend, bounded by its single configured host.

**Server-side client** — the generated, typed client server components, server actions and the
proxy itself call. It attaches the bearer, the caller's forwarded address and the locale.

**Browser client / query hooks** — the same generated types over a client pointed at this origin,
wrapped in query hooks. This is how a client component reads or writes the new API.

**Unwrap** — the one interface callers use to turn a client result into data or a parsed error.
Parsers and the parser manager sit behind it and are not addressed directly.

**Action** — a server-side write that must set a cookie, redirect or invalidate the framework
cache. Anything else is a **mutation** through the query hooks.

**Session provider** — the root-layout provider that carries identity, and only identity, from the
sealed cookie to client components.

## Consequences

**The browser holds no credential capable of calling a backend.** An injected script's blast radius
is now what the proxy allows: no authentication endpoints, no path outside the published
specification, no `Authorization` of its own, and no token to carry away.

**Cross-tab session changes are no longer noticed.** The old session hook read the readable cookie
through an external store and re-read it on focus and visibility changes, so a sign-out in another
tab showed up on returning to this one. A provider fed by the server has no equivalent: its value is
fixed until the next server render. This follows from closing the token rather than from an
oversight, and if it ever matters it needs a broadcast channel or a poll — deliberately not built
here.

**Both proxies allow-list request headers rather than only stripping `Authorization`.** Content type
and accept are all that travel up. Nothing in the repository sets or reads a language header and the
server-side legacy client never sent one, so this changes nothing today — but "the browser called
the backend directly" used to mean the browser's whole header set went with it, and it no longer
does. A header a backend starts depending on must be added to the list explicitly.

**Every browser call costs one hop through this application's server.** It is one hop, not two: the
proxy forwards through the server-side client, which passes the caller's address on, so the backend
sees what it sees today. The cost is latency and the application's own compute on a path that used
to be browser-to-backend.

**A new browser call costs a hook and nothing else.** No route handler, no allow-list edit, no
serialiser. That is the point of the catch-all, and it is what would be lost by moving to
per-endpoint handlers later.

**Exactly one cast exists, at the proxy's call into the server-side client.** That method's
signature is generic over literal path types and the proxy's path is only known at runtime. The cast
carries a comment saying so. No other cast was introduced and `any` is not used.

**The legacy layer is now reachable only through a second proxy that will be deleted.** Until then
there are two forwarders under one namespace whose route precedence matters, and legacy screens
continue to fail authentication exactly as record 0008 said they would — that is unchanged by this
work, not fixed by it.

**Two error vocabularies coexist.** The new API's parsed error and the legacy client's own type do
not merge, and a screen that touches both handles both. They merge by deletion, when the legacy
layer goes.

**The renewal race recorded in 0008 is unchanged.** Rotating refresh tokens still mean two
simultaneous renewals can cost a session. Routing browser traffic through the server neither causes
nor cures it.

## What would make this worth revisiting

**A request body that is not JSON.** Every operation the specification declares a body for takes
JSON, so the proxy reads one and refuses anything else rather than forwarding bytes the API cannot
read. A multipart upload would need its own way through. Responses are unaffected — a success body
is left as a stream and passes through as the bytes the API sent.

**A second API with a second error envelope.** That is the case the parser interface and manager
exist for, and it would convert them from an inherited shape into a used one.

**The legacy layer reaching zero call sites.** The legacy proxy, its base path and the second
vocabulary of errors all go with it, and the route precedence under the API namespace stops
mattering.

**Cross-tab sign-out becoming a real complaint.** It is the one behaviour this work removed.
