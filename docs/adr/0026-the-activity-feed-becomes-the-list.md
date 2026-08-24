# 0026 — The activity feed becomes the list, one exit condition short

**Status:** Accepted — August 2026. **Supersedes
[0014](0014-a-two-source-activity-list.md)**, which rejected this feed as the list's spine and named
two conditions for adopting it. One has been met by the upstream. The other has not, and this record
adopts the feed anyway — that is the whole of the trade below. It also stands on an answer the
legacy retirement track ([0022](0022-retiring-the-legacy-layer-on-its-own-track.md)) said would be
obtained from the backend before anything depended on it, and which has not been obtained.

## Context

The member's activity list is one list of everything they have asked the product for, ordered by
recency. 0014 recorded why it was composed from two sources: the new API's location request list,
plus one legacy merged endpoint for the two kinds the new API could not answer for. It named exactly
what had to change upstream before the API's own activity feed could become the list's spine:

- the feed's reverse lookup row had to carry the phone number the report was run on, because that
  number is what such a row is _called_; and
- the feed had to model sex offender reports as a kind of its own, so those rows would still have a
  representation.

**The first condition is met.** The feed now publishes, on every row, the number the row concerns —
the request's recipient for a location request, the subject for a reverse lookup report. A report row
can be titled from the page it arrives on, with no call per row.

**The second is not.** The feed still models two kinds. A sex offender report has no representation
in it.

**And the list has been showing less than 0014 described for some time.** The legacy read that
served the reverse lookup and sex offender rows was commented out while the location flow was being
moved, and never restored. So the state this record changes is not the two-source list — it is a
list that shows location requests and nothing else. Weighed against that, adopting the feed _adds_ a
kind back rather than removing one.

**The feed also brings paging.** It is cursor-paginated, twenty rows to a page by default, where the
list endpoint it replaces answered with everything at once.

**One question underneath all of this is still open.** A row's identifier is the underlying record's
own, in the upstream that answered — and the screen a reverse lookup row leads to reads its report
from the legacy backend. Whether a report created there is the report the new API's feed lists, under
the same identifier, is the question 0022 named and left to the backend to answer. It has not been
answered.

## Decision

**The activity feed is the list's only source.** The location request list read is retired from this
screen, and no legacy endpoint is read in its place. Both kinds the feed answers for are shown.

**The row model stays the screen's own, and keeps its four kinds.** The feed's kind alone does not
say which of the two location requests a row is — that is on the row's nested location, which is also
where an answered request's address is — so the pair is still mapped onto two kinds of the screen's
own, because everything the screen varies between them varies as a pair. The sex offender kind stays
in that model with no source filling it: it is what the icons, the destinations and the descriptions
are still written for, and restoring the rows is then a mapping rather than a re-modelling.

**The two status vocabularies are narrowed onto the four states the screen draws.** A report being
generated is shown as one still waiting; a report whose generation failed is shown the way a request
the recipient turned down is shown. The feed passes each source's status through unmapped and types
it as a plain string, so a value this screen has not been taught is part of the contract rather than
an anomaly: it reads as one still waiting, and the row stays on the list.

**The row shows the key the feed orders by, and nothing re-sorts.** The feed publishes both its sort
key and a truer "when did this last change" timestamp; the screen shows the sort key, so the dates
down the list are in the order the list is in. Sorting locally is not open to it any more — with
paging, a sort inside the pages in hand can only contradict the order of the pages that are not.

**The first page is read on the server; the browser asks for the pages after it.** The server hands
down the cursor its page ended on, and the browser starts there — so no page is fetched twice and no
server-fetched data has to be handed across as initial state. Nothing is fetched until the member
asks for more.

**The read is a getter, and the mapping is not part of it.** The getter asks for a page and hands
back the page and the cursor exactly as the API stated them. The mapping onto the screen's rows is a
pure function belonging to the screen, which is what lets the server map the page it rendered and the
browser map the pages it fetches afterwards through the same code.

**The retry the feed introduces is not adopted here.** The feed marks a failed report as retryable
and the API offers an endpoint to re-dispatch it. Nothing in the product had that capability before,
so adopting it is a new feature rather than part of moving a read, and the flag is not carried onto
the row model until something reads it.

## Consequences

**Reverse lookup rows are back, and they lead somewhere on an assumption.** A report row opens the
existing report screen, which reads the report from the legacy backend by the identifier the row
carries. If the two upstreams turn out not to share that storage, the failure is visible: a row that
opens an empty report. This is accepted knowingly rather than guarded against — a guard would have to
be a call per row, on a list that exists to be scanned, which is the cost 0014 rejected for the same
reason.

**Sex offender rows stay gone, and this record is where that stops being temporary by accident.**
0014 called their disappearance unacceptable and kept a frozen client alive to prevent it; the client
went quiet anyway. Stating it here makes it a known gap with an owner upstream, rather than a
commented-out line nobody is accountable for.

**A failed report is indistinguishable from a rejected request on the row.** Both are drawn the same
way, and the description a rejected location request shows — advice about the message sent to the
recipient — is what a failed report will show too. That is the price of not adding a fifth state, and
it becomes worth revisiting the moment the retry above is adopted, because retryability is the only
thing that tells the two apart.

**The list can now be incomplete on first render, which it never was before.** Anything past the
first page needs a press. The screen has no other paging, so a member with a long history sees twenty
rows and a button where they used to see everything.

**A page already fetched in the browser is not refetched while the member stays on the screen.** The
pages below the first are only ever appended, and refetching them on a window focus would reshuffle
rows under someone mid-scroll.

**The screen is now on one upstream, with no legacy read of its own.** That is one screen fewer on
the legacy layer, arrived at from the redesign's side rather than the retirement track's — the
counting of the surface that track owns should be read as one call lighter.

## Alternatives considered

**Keeping the two-source list as 0014 described it.** Rejected: it would mean restoring a legacy read
to serve one kind the upstream has agreed to model eventually, and it would leave the reverse lookup
rows titled from a source being retired when the feed can now title them itself.

**Waiting for the sex offender kind before adopting the feed.** Rejected because it mistakes what is
being compared. The list on the screen today shows one kind; waiting keeps it at one kind for as long
as the upstream takes, in exchange for a completeness the screen has not had for weeks.

**Showing reverse lookup rows without letting them open.** Rejected: it makes the open question
visible to the member as a dead row rather than to us as a risk, and it is a worse answer than the
assumption if the storage is shared — which is the likelier case, and the one the backend was asked
to confirm.

**A fifth state for a failed report.** Deferred rather than rejected. It buys a truthful badge and an
honest description, and it is the natural companion of the retry endpoint; adopting it alone would
add a state whose only distinguishing affordance is one this record does not build.

**Reading every page on the server.** Rejected: it preserves the old screen's "everything at once" at
the cost of an unbounded number of upstream calls inside one render, for the members with the most
history — the exact people it would be slowest for.
