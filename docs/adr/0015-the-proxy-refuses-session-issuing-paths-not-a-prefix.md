# 0015 — The proxy refuses the paths that issue a session, not the authentication prefix

**Status:** Accepted — August 2026. Supersedes the "the proxy refuses the authentication endpoints
outright" decision of [0009](0009-one-proxy-for-every-browser-call.md). Everything else in that
record stands, including the sealed session it protects
([0008](0008-a-sealed-session-on-the-new-api.md)) and the one-client rule
([0010](0010-one-client-for-the-auth-calls-too.md)).

## Context

Record 0009 opened one door from the browser onto the new API and closed it to the API's
authentication subtree in a single line: everything under the authentication prefix is refused,
because minting, renewing and revoking a session are server-only flows owned by the session module.
That was true of every operation the subtree held at the time.

**The subtree has since stopped being uniform.** The API now publishes an operation under the same
prefix that mails a member a new password when they cannot sign in. It issues no token, sets nothing,
and answers the same way whatever address it is given — deliberately, so that the response cannot be
used to find out which addresses have accounts. There is nothing in it for the prefix rule to
protect, and it is wanted precisely where the rule bites hardest: on a public page, from the dialog
that asks for the address.

**The prefix was standing in for the property that actually matters.** What must not reach a page
script is a credential the script can read. The proxy already filters response headers, so the
backend cannot write a cookie into this origin — but a success body passes through as it is, and six
of the subtree's operations answer with a token pair in that body. Refusing by path prefix caught all
six, and caught the password mail with them, because the prefix is where they happen to live rather
than what they do.

Two ways to route the password mail around the rule were available and both were worse than changing
it. A server action would have worked — the write is small and the action client is there — but it
would have made the rule's approximation permanent and put a call with nothing to protect on the
server for no reason other than a name in its path. A single exception written next to the prefix
check would have left the codebase with a rule plus a growing list of things the rule is wrong about.

## Decision

**The proxy refuses a path because of what the path hands back, not because of where it lives.** The
prefix check is replaced by a list of refused path templates, matched by the same machinery as the
published-path allow-list, so a parameterised path is refused for every value of its parameter.

**What is on the list, and why.** Every operation whose success body carries a token pair: signing
in, registering, exchanging a refresh token, opening a guest session, verifying a magic link, and
registering through a social provider. A body carrying a readable credential is the thing the sealed
session exists to prevent, and it is the one part of the response the proxy passes through
untouched. The address lookup is on the list for a different reason — it answers whether an address
has an account, which from a page script is an account enumerator.

**Requesting a new password by mail is forwarded like any other published path.** It reaches the API
through the proxy, with the session's bearer attached if there happens to be one and without it if
there is not; the API accepts it either way. The browser therefore calls it through the ordinary
query hooks, which is what record 0009's rule for a write without a cookie, a redirect or a cache
invalidation already said should happen.

**The list is written by hand, and that is the cost accepted here.** The generator that emits the
allow-list could derive this second list from each operation's response schema. It does not, because
the refusal is a security boundary and a boundary that appears and disappears with a regeneration is
harder to reason about than one that is read in the file that enforces it. The consequence is stated
below rather than hidden.

## Alternatives considered

**Keep the prefix and make the password mail a server action.** Works today, costs nothing to build,
and was the shape first proposed. Rejected because it answers a question about the proxy by moving
the caller: the rule stays an approximation, and the next operation added under the prefix with
nothing to protect gets the same detour.

**Keep the prefix, add an exception beside it.** Two lines. Rejected because the rule then reads as
"no authentication paths, except the ones we have noticed" — an exception list is only better than a
refusal list when the exceptions are the rare case, and here the refusals are.

**Derive the refusal list from the specification during generation.** Attractive, and the reason the
allow-list exists in generated form. Rejected for now on the grounds above: a regeneration that
silently narrows or widens a security boundary is a worse failure mode than a list someone has to
read, and the two lists are not the same kind of thing — one is what the API publishes, the other is
what this application refuses to relay.

**Buffer each response and refuse any body containing a token.** Enforces the property directly,
whatever the specification says. Rejected because it gives up the streamed pass-through that lets a
PDF or a metrics payload cross unchanged, and because it refuses only after the backend has already
acted.

## Consequences

**A regeneration of the specification needs the refusal list read again.** An operation added
upstream that answers with a token pair is relayed to the browser until its path is written into the
list. This is the accepted cost of the decision above, and it is the one thing about this record that
someone maintaining the API layer has to remember.

**The refusal message is no longer about authentication.** It says the path is not served to the
browser, because the list no longer describes one subtree. The error code the envelope carries is
unchanged, so anything reading the code still reads the same code.

**The dialog that asks for a forgotten password holds no server action and no credential.** It calls
a generated hook, the proxy attaches whatever the session has, and a failure arriving at the call
site is the network or the API — never a verdict on the address, which the API declines to give.

## What would make this worth revisiting

A refusal list long enough that reading it stops being how someone checks it, or a second refusal
added for a reason unrelated to what the body carries. Either would mean the list has become a
category rather than an enumeration, and a category is worth generating — with a test asserting the
generated list against the specification, so that a regeneration cannot quietly shorten it.
