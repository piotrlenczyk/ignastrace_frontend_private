# 0014 — The activity list is composed from two sources

**Status:** Superseded by [0026](0026-the-activity-feed-becomes-the-list.md) — August 2026. One of
the two exit conditions listed below was met by the upstream; the other was not, and 0026 adopts the
activity feed as the list's only source anyway. Everything here about a second source, and about the
sex offender rows it kept alive, is history rather than the current state.

## Context

The member's activity list is one list of everything they have asked the product for, ordered by
recency: Location requests, reverse lookup reports, and sex offender reports. Until now all three
kinds came from a single legacy endpoint that merged them, and one shape described all three at
once — a shape whose fields only make sense for one kind at a time, with a nested location on a
row that has no location and a phone number on a row that has no phone.

Moving the Location requests flow onto the new API brought that list into scope. Every other slice
of that work replaced a legacy read outright, and the intention here was the same: read the list
from the new API and delete the legacy one.

Two facts about what the new API publishes made that impossible without changing what the screen
shows.

The new API publishes an **activity feed** that looks, at first, like the list's natural spine: it
is cursor-paginated, ordered by most recent change, and models a row as a kind plus a status. It
was evaluated as exactly that, and rejected — for two reasons that are about the model, not about
the effort of adopting it.

The first is that the feed's reverse lookup row carries no phone number, and the phone number is
what a reverse lookup row is _called_. Nothing else on the row identifies the search to the person
who ran it. Titling it from the feed would mean inventing a title, or reading each report
individually to find one — a call per row, on a list that exists to be scanned.

The second is that the feed models two kinds. Sex offender reports have no representation in it at
all. Adopting the feed as the spine would mean the sex offender rows simply stop appearing, which
is not a migration but a removal of a feature.

So the choice was between a list that shows less than it shows today, and a list that keeps reading
one legacy endpoint for the two kinds the new API cannot answer for. The second is worse in exactly
one respect — a frozen client survives one more release — and better in every other.

## Decision

**The list is composed from two sources.** Location request rows come from the new API's list
endpoint. Reverse lookup and sex offender rows continue to come from the legacy merged endpoint,
filtered to those two kinds; its Location rows are dropped, because the new API now serves them.

**Both sources are mapped onto one view type owned by the list.** That type is not an adapter onto
either shape — neither source's model is the target. It states the list's own vocabulary of kinds
and of statuses, and the row component, the icons and the status badge read only that. The badge's
class table and its translation keys are keyed on the list's status vocabulary, so a row lands on
the same badge whichever source answered for it.

The mapping is where the two sources' differences are absorbed, and it is deliberately visible as
one thing in one place: the new API states statuses in upper case with its fields flat, the legacy
source states the same statuses in lower case and nests a location. Two Location request types
become two kinds rather than one kind with a type beside it, because everything that varies between
them varies as a pair — the icon, the title, the destination, and whether an unanswered row offers
to ask again.

**The read that keeps the legacy client is a knowing exception, and it is confined to one module.**
New code may not import the frozen legacy clients. This module does, for the one read the new API
cannot serve, and says so where a reader will find it. Confining it is the point: when the exit
conditions below are met, the change is a deletion rather than an untangling.

## Consequences

The list makes two calls per render instead of one. They do not depend on each other, so they are
issued together, and an empty answer from either leaves the other's rows exactly where they are.
Neither source can be trusted to order the other, so the merged list is sorted by recency itself —
each source is already ordered on its own, and the sort is what makes them one list rather than one
appended to the other.

The screen's appearance and behaviour are unchanged. Every row still leads where it led, an
unanswered number-type request still offers to ask again with the same recipient, and a row that
has been answered still shows its resolved address without being opened.

This is the point at which the expand–contract on the Location shapes contracts. Every other slice
of the flow is an ancestor of this one, so this is the first moment the legacy location shape, the
legacy location status response shape and the legacy merged service request shape have no callers
left, and all three are deleted here. The legacy notifications screen quoted the location shape, so
it now states the handful of fields it reads itself — a legacy screen's own declaration, which dies
with the screen instead of outliving it as a module new code could reach for. The request-count
shape is kept: the reverse lookup funnel and the shared counter component read it too, and it is
structurally identical to the new dispatch-count response.

## Exit conditions

The legacy read, the mapping onto the view type from it, and this record are removed when **both**
of the following are true of the new API:

- its reverse lookup report response publishes the phone number the report was run on, so a row can
  be titled without a call per row; and
- its activity feed models sex offender reports as a kind of its own, so those rows have a
  representation there.

Until then, replacing the legacy read means showing the member less than the product already shows
them.

## Alternatives considered

**The new API's activity feed as the list's spine.** Rejected for the two model facts above. It
remains the right answer once they change, and nothing here forecloses it.

**The activity feed for ordering, with a call per row for the details.** This keeps one source and
titles every row correctly, at the cost of one request per row on the screen whose whole purpose is
to be scanned. Rejected: it trades a visible cost for an invisible one.

**Sex offender rows dropped, reverse lookup rows titled by something else.** Rejected outright. The
migration's job is to change what the screen talks to, not what it shows.

**Adapting the new API's rows onto the legacy shape.** This would have been the smallest diff — the
components would not have changed at all. Rejected because it makes the retired model the target:
every new field would arrive by being bent into a shape designed for something else, and the seam
would be spread across every component instead of standing in one module that can be deleted whole.
