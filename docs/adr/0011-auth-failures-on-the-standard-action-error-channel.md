# 0011 — Authentication failures travel the standard action-error channel

**Status:** Accepted — August 2026. Completes the interim recorded as a consequence of
[0010](0010-one-client-for-the-auth-calls-too.md), which carried the API's error envelope as far as
the operations and left carrying it to a form as a separate decision.

## Context

Every failure of an API call in this application reaches the caller one way: the standard API error,
which the one server-action client shapes into a structured action error carrying the API's own
envelope and the response's status. A type guard for recognising that shape on the client has
existed since the action client was written.

Authentication was the exception. Sign-in and registration answered their callers with an outcome
object — success, or failure with a reason drawn from a union written by hand — and chose the reason
by reading an HTTP status off the failure. Around each action sat a wrapper built on the query
library, whose only job was to turn that outcome back into a thrown error, because that is the
channel a mutation gives a failure. One of those wrappers carried an error class of its own for the
purpose. A form then read the reason off it.

**Three costs.** A second failure vocabulary for one layer, which every reader of it had to learn
before reading anything else. A failure translated twice on its way to the form — from the API's
envelope to a hand-written reason, then from a returned outcome to a thrown error — with the
envelope discarded at the first step. And branching on a numeric status, which conflates conditions
the specification distinguishes: the codes it declares per status are stable, a status is not, and
two conditions sharing one status cannot be told apart at all.

**Nothing about the visitor's experience was under discussion.** A wrong password and an address
that already has an account both had messages, in the right places, in every language. The change is
which channel carries them.

## Decision

**A refused authentication call propagates.** The operations catch nothing and translate nothing.
The action client's error handler is what shapes a refusal, exactly as it shapes every other API
refusal, and the form receives the API's envelope and the status.

**The hand-rolled outcome types are gone**, along with the reason unions, the query-library wrappers
around the actions, and the bespoke registration error class. An authentication action either
completes or answers with a server error; there is no third shape.

**A token pair that cannot be turned into a session raises a plain error**, which becomes the action
library's default server-error message. This is an internal fault — the API issued a pair, and
nothing in it names a user — not a condition the visitor can act on, and it earns no code of its own.
A credentials-shaped message here would be a lie.

**Forms branch on the API's error code, never on a status.** Registration matches the conflict codes
the specification's enumeration declares for an address already registered, and puts its existing
message on the address field; every other failure falls back to the existing generic toast. Both
names the shared enumeration carries for that one condition are accepted, so the field keeps getting
its message whichever the deployment answers with, and the set is typed against the generated
enumeration so a rename upstream fails the type check rather than falling silently through to the
toast.

**The login screen goes on giving one answer.** Whether the account is missing or the password is
wrong, the same message lands on the password field. The error code is available and deliberately
unread there.

**Forms invoke the actions through the action library's own hook**, which is now the one way a
server action is called in this repository, and read the structured error through the type guard
that was written for this and had no call sites until now.

## Alternatives considered

**Keeping the outcome objects and filling them from the error code instead of the status.** The
smaller change: the hand-written unions survive, but at least they are derived from something
stable. Rejected because the unions are the cost, not their source. They are a second vocabulary
for one layer, and every reason in them is a worse-typed restatement of something the envelope
already says.

**Distinguishing a missing account from a wrong password on the login screen**, which the codes now
make trivial. Rejected on two counts: it changes what the visitor reads and so needs new copy in
every language, and a form that answers "no such account" differently from "wrong password" is a way
of finding out which addresses have accounts.

**Reading the status off the structured error rather than the code.** It is carried, and it is
occasionally what a caller wants. Rejected as the default because it is the property that conflates
conditions — the reason this record exists — and a caller who reaches for it should have to say why.

## Consequences

**A refusal whose body is not the API's envelope arrives as the generic message.** A gateway's HTML
or a connection that never opened carries no code, so it is not a structured action error and no
form branches on it. This is the property 0010 recorded on the way in; it now reaches the visitor as
the generic failure rather than as a status-derived guess. It is the correct answer for a failure the
API did not describe.

**Validation failures and refusals reach a form through different fields of one result.** A rejected
input arrives as validation errors, a refusal as the server error. Both mean the submission did not
take effect, and a form that treats them alike — as the login screen does — has to say so
deliberately rather than get it by accident.

**The action client is reachable from the browser bundle.** Forms import the type guard from the
module that builds the client, so that module is bundled where it runs. It holds no secret and calls
nothing on import; the cost is a few unused bytes, and the alternative is a second home for a guard
whose whole purpose is to be called from a form.

**Authentication is testable at the seam a form actually uses.** An input in, an action result out,
with the request's cookie jar and the cache invalidation substituted at the framework boundary. The
operation-level test that took a cookie jar as an argument is superseded; its cases moved up, and
what they assert is now the thing a form depends on rather than a shape only the operations knew.

## What would make this worth revisiting

**A screen that needs to tell two conditions sharing a status apart.** That is what this record buys,
and the first such screen is the first proof it was worth buying.

**Copy for a login screen that names which half was wrong.** The enumeration decision would be
reopened, though the account-enumeration objection stands on its own and would need answering
separately.

**A second error envelope, from a second backend.** The parser layer behind the shared unwrap is
where that lands; which channel carries the result would not change.
