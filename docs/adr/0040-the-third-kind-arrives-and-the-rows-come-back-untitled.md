# 0040 — The third kind arrives, and the rows come back untitled

**Status:** Accepted — August 2026. **Corrects one consequence of**
[0026](0026-the-activity-feed-becomes-the-list.md): "sex offender rows stay gone, and this record is
where that stops being temporary by accident". They are not gone any more. This record closes the
**second and last exit condition** [0014](0014-a-two-source-activity-list.md) named for adopting the
feed as the list's spine — the first was already met when 0026 adopted it anyway — so the trade 0026
made on credit is now paid off. It builds on
[0039](0039-the-standalone-search-moves-and-its-unlock-joins-the-sequence.md), which moved the
standalone search family onto the new API and left the member with no route back to a record they had
paid for; this is that route. It changes nothing about
[0009](0009-one-proxy-for-every-browser-call.md), adds no call and no upstream request, and touches
the payments service not at all.

## Context

**The upstream models the third kind now.** When 0026 adopted the activity feed it modelled two:
location requests and reverse-lookup reports. Its enumeration declares three, and has since the
regeneration that came with 0039 — `LOCATION_REQUEST`, `REVERSE_LOOKUP_REPORT`,
`SEX_OFFENDER_SEARCH_REPORT`. Nothing upstream is asked for here and nothing is regenerated: the
contract already carries what this record builds on. The endpoint's prose summary still says two
sources; it is stale, and the enumeration is the contract.

**What the feed states about such a row:** the identifier is the purchased report's own — the one
0039's screen reads the record by — the status is the fixed string `READY`, the phone is null, no
location object is present at all, `retryable` is false, and creation, sort key and status-change
timestamp are all the moment of purchase.

**The state this record changes is worse than the absence 0026 recorded.** The feed answers with the
row and the list draws it — as a location request, because the mapping's kind branch was a ternary
whose default arm meant one. So the member saw a row with no title, a chat icon, the badge _Pending_,
the sentence _Waiting for the recipient to share their geolocation_, no way to open it, and a retry
that led to the message-sending screen with an empty recipient. Two independent defaults produced
that between them: the kind's, and a status table with no entry for `READY`, which fell to the
waiting state — the state that also withholds the click. A paid-for record was presented as somebody
else's unanswered text message, which reads, correctly enough from the outside, as the row not being
there at all.

**And it was the only route back.** 0039 records the dead end it left: the new API publishes no list
of searches, no list of reports, and no report identifier on a candidate, so a member who closed the
tab after buying a record could not reach it again by any means.

## Decision

**Sex-offender search reports are a kind of row, in recency order among the other two.** The row
carries the shield icon the screen already had written for it, the badge _Report created_, the
existing description _Sex offender background report_, the date the record was bought, and it opens
the standalone record's screen with the feed's identifier. It offers no retry, because there is
nothing to ask again.

**The row is titled by what it is — _Sex offender report_ — and not by whom it is about.** This is
the one place the record is knowingly below the legacy list, which titled these rows with the name
the record was bought for. See the consequence below.

**The kind is renamed to `SEX_OFFENDER_SEARCH_REPORT`.** The product has two things called a sex
offender report — the section bought per report owner inside a reverse-lookup report, and this
standalone purchased record — and the row is the second. The list's old spelling,
`SEX_OFFENDER_REPORT`, named neither of them unambiguously. The new name is the feed's own, so the two
vocabularies agree and the difference between them carries no implied meaning.

**The mapping branches on all three source kinds by name.** No arm means "whatever is left", so a
fourth kind arriving upstream is a compile error rather than a row drawn as something it is not —
which is precisely the failure above. Only the location-request pair is split further, by the nested
location's type, for 0026's reason: everything the screen varies between those two varies as a pair.
The module stays what 0026 made it — a pure function from a page of feed items to a page of rows, with
no client, no cache and no sorting — so the server maps the page it rendered and the browser maps the
pages it fetches through the same code.

**`READY` joins the one shared status table.** The list keeps its four states; the source vocabulary
the table maps from gains the one word the third source states. It is deliberately not derived from
the kind: if that source ever gains an intermediate state, a row must read as one still waiting rather
than assert a readiness nobody stated — the rule 0026 set for a status this screen has not been
taught. One table for three sources rather than one per kind, because the kind adds nothing to the
answer: the seven words do not collide.

**The title copy lives in the row component, and the row model's title stays empty for this kind.**
The mapping is pure and has no access to translations, so the component's title switch answers for
this kind from a new key in the screen's existing namespace. The comment on the row model's title
field, which promised "the name a sex offender report was produced for", now states that this kind
carries no name and is titled by the component — so the empty value is a documented fact rather than a
suspected bug.

**One new English string**, beside the existing description in the status namespace. It is not
`__NEW__` copy: this is a legacy screen keeping its legacy palette, components and namespace, and only
its content changes. No other locale is touched and no Lokalise script is run.

## Consequences

**The row does not say whom the record is about, and the member may hold two.** Two purchases produce
two rows titled identically, told apart only by their dates. That is a real step below the legacy
list, taken because the feed does not publish the name and because a name per row is otherwise only
obtainable at one call per row — the cost both 0014 and 0026 rejected for a list that exists to be
scanned. **The condition that closes it is a name published on the feed row**; it is small on the
backend, it is the one change that restores parity, and until it lands this consequence is the
regression's owner.

**0026's last unmet exit condition is now met, and its consequence about these rows is wrong.** That
record is corrected in place with a pointer here rather than superseded — everything else it decided
still holds, and it remains the record for the feed being the list's source.

**A row that leads somewhere on an assumption is still one row, not two.** 0026's open identifier
question was about reverse-lookup reports, whose screen once read the legacy backend. This kind's row
leads to a screen that reads the new API by the identifier the new API issued, so no translation of
identifiers is involved and nothing new is assumed.

**Shipping this ahead of any particular upstream deployment is safe.** An API older than the third
source simply carries no such rows, and the list behaves exactly as it did.

**A failed report still reads as a rejected request, and no retry is adopted.** Both deferrals of
0026 stand untouched.

## Alternatives considered

**Asking the backend to publish the name.** Correct eventually, and named above as the closing
condition. Not done here: it is an upstream change, and the row's absence is the member-visible
problem.

**One call per row to fetch the name.** Rejected for the third time, for the reason 0014 and 0026 both
gave: a list that exists to be scanned cannot cost a call per line.

**Titling the row from the purchase date.** Rejected: the date is already on the row, so the title
would say nothing the reader cannot see, and it would read as a bug.

**A status table per kind.** Rejected: three tables for seven values that do not collide, and the kind
adds nothing to the answer.

**Deriving `READY` from the kind rather than mapping the word.** Rejected: it would make an
intermediate state the source might later publish assert readiness, which is the one thing 0026's rule
about untaught statuses forbids.
