# 0020 — One answer to what is switched on

**Status:** Accepted — August 2026. Supersedes the settings seam
[0019](0019-the-parked-checkout-island.md) left for the payments integration.

## Context

This application had three ways of asking whether something was on, and they disagreed on
everything except the answer's type.

The backend published a bag of flags, fetched on every request through the frozen legacy client and
handed to the browser in a provider of its own. Its keys were the backend's — `SCREAMING_SNAKE`,
typed as an open record, so a misspelling read as `undefined` and the screen simply behaved as
though the feature were off. That client signs a caller out on a refusal, which meant a flag lookup
in the root layout could redirect a visitor who had never signed in.

Separately, the environment held switches that components read straight out of `process.env`, each
one deriving its own answer at the call site — one of them recomputing "does this country expect a
ZIP code" inline, in a client component, from a variable that had to be public to be legible there.

Separately again, the country the request came from had a provider and a hook of its own, and
overriding a setting for testing meant knowing which of two cookie conventions applied: one flag
answered to `'true'` under one name, the country to a bare code under another, and nothing else was
overridable at all.

The reference frontend this redesign draws on had already settled this shape: settings computed once
per request on the server, named for intent, handed to the client as data. What it had not settled is
this application's complication — that one of the three sources is a backend, not a variable.

## Decision

**There is one settings object, settled on the server, and it is the only answer.** Three sources
feed it — the API's flags, this application's environment, and the override cookies — and a reader is
told which only by reading the module that reconciles them. The provider carries that object to the
client unchanged; a client component asks the hook, a server component asks the reader, and neither
reaches a variable or an endpoint of its own. The previous features and country providers, their
hooks and their server getters are gone rather than wrapped, so there is one vocabulary and no
deprecated second one to drift.

**The backend-owned flags are read from the new API, through the generated client.** This was the
intent from the start and is what the data-layer record requires of a server-side read; the first
version of this module could not do it, because the two backends answered a same-named endpoint with
different vocabularies and the new API published none of the switches this application asked about.
That endpoint now has a flag registry — `camelCase` keys, declared in code, deploy-time only — so the
read moves onto `apiServerClient['/api/v1/features']` and the bare request to the legacy backend is
gone. The temporary seam this record used to describe is closed; nothing in the settings layer reads
outside a generated client any more.

**A flag the API does not publish yet is still a declared field.** The registry carries one of the
three this application asks about — the sex-offender report's compliance gate. The other two are
declared here in the shape the registry gives a flag, so the day the backend adds them the change is
a deployment and not a code change; until then the response does not mention them and each resolves
to its default. An absent key and an unreadable endpoint deliberately look alike from the reader's
side, which is what makes those defaults the whole answer to both.

**Every setting is a named, intentional field, and the backend's keys stop at the boundary.**
Translating the API's open record into declared fields is what makes a misspelling a type error, and
it is why the flag list is short and explicit: a flag the backend publishes and nothing reads does
not appear. The cost is deliberate — a new backend flag needs a line here before a screen can read
it, which is the same cost as a new endpoint needing a hook.

**A read that fails is a page that still renders.** Every field has a declared default. When the
flags endpoint cannot be read — refused, unparseable, or unreachable, which are one answer here — the
fields it owns fall back to those defaults, the incident is logged, and nothing redirects: the
endpoint is one input to a layout that has to render for a signed-out visitor, not a screen's own
read. A switch defaults off, because a feature that quietly disappears is visible to whoever looks at
the screen where a half-built one that quietly appears is not. **Reverse lookup and the SMS consent
step default on, and are the deliberate exception.** They are shipped product areas whose flags the
API's registry does not carry, so failing closed on them would take two live features off for
everyone on the strength of a switch nobody has declared. They stay on until the registry has them,
after which the API's answer wins as it does for every other flag.

**One override cookie contract, tri-state, and it wins.** One name shape, one vocabulary of values,
and three answers where the source has two: on, off, or absent — only the last defers to the source.
That is what lets a single cookie turn a feature on where the source says off _and_ off where it says
on. The previous single-purpose override cookie is replaced rather than kept working; its
value dialect and its name were both one-offs. The country override keeps its own name and shape,
because it overrides a value rather than a switch.

**Environment flags are read liberally, and they need no public prefix.** Both `1` and `true` count
as on, because the two configurations this codebase draws from disagree, and — with fail-closed
defaults — a dialect mismatch is a feature silently lost rather than an error anyone sees. Since
settings are computed on the server and delivered as data, a switch no longer has to be public to be
legible in the browser; the flags are renamed to a single non-public prefix, which moves one of them
from build-time configuration to runtime configuration.

**The widget that sets these cookies is part of the same decision.** It is turned on by the
environment only, never by a cookie, because it reads the configuration back to whoever opens it. It
also carries the payments service's own override cookies, which this application already forwards
upstream — the prefix is a rule, so the widget's list of them is a convenience, not the boundary.

## Consequences

A screen asks one question of one place, and the answer is typed. A flag becomes a declared field, a
declared default, and — if it is worth overriding — a cookie name: three small additions in one
module rather than a new provider or a fresh `process.env` read at a call site. Two cookies that used
to be QA folklore are a documented, uniform contract with a panel that sets them.

Three things are worth stating plainly. One source is read outside both generated clients, as
described above, and that is a known deviation with a known end. The environment variables are
renamed without a transitional reading of the old names, so an environment that sets an old name
anywhere outside this repository loses that feature at the next deployment, silently — one of them
also moves from build-time to runtime configuration, so it has to be present where the container
reads its environment rather than where the image is built. And the widget's copy is written in place
rather than in the locale file, because it is a tool for whoever is testing the application and never
part of what a visitor is served.
