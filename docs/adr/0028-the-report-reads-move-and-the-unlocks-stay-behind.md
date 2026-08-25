# 0028 — The report reads move and the unlocks stay behind

**Status:** Accepted — August 2026. Continues the legacy-retirement track
[0022](0022-retiring-the-legacy-layer-on-its-own-track.md) opened, on the assumption
[0027](0027-the-reverse-lookup-creation-starts-on-an-unanswered-assumption.md) started the
reverse-lookup family on. It is the fourth record to move work onto a new upstream ahead of an answer
about who owns the records, after
[0024](0024-the-subscription-read-moves-to-payments-before-the-data-does.md),
[0025](0025-the-subscription-writes-follow-the-read-onto-payments.md) and 0027, and it closes #96 on
the track's epic (#69).

## Context

**Three of the largest calls left on the legacy data layer serve four screens**: the member's
reverse-lookup report, its data-breach history, one owner's sex-offender record, and the report's
social-media section. `GET /reverse_lookups/:id`, `GET /reverse_lookups/:id/data_leaks` and
`GET /sex_offenders_data/:id` are untyped end to end, forwarded by a proxy with no specification, and
pointed at a backend host that exists for that layer alone.

**Nothing about this is visible to a member and nothing about it is broken.** The driver is the same
one 0027 named: the legacy apparatus goes when its last caller goes, and while these three live the
deletion date is not a date anyone can choose.

**The three travel together because they are welded together, not because it is convenient.** The
legacy report read is one fat object carrying both report metadata and every section's content; the
new API splits it into a metadata endpoint and a sectioned one. The sectioned response carries no
sex-offender record identifier — the only key the legacy detail screen can be opened with — so moving
the report read alone breaks the link behind it. And the data-breach screen read the legacy report
solely to obtain one upsell boolean as its gate, while the new data-breach endpoint is its own gate,
so moving the report read alone would leave that screen fetching an entire sectioned report to read
one boolean. 0022's grouping exception covers exactly this: endpoints blocked by the same missing
thing move together.

**0027 left the family started and its record-ownership question unresolved.** Whether the two
upstreams share reverse-lookup report storage has still not been answered, and no date is attached to
answering it. This record inherits that assumption rather than re-arguing it; what it adds is a second
assumption of the same shape, about a different set of records.

## Decision

### Section state is read from the new API while unlocks are still written to legacy

This is the principal risk and it is stated first.

The report's three gated sections stop reading `reverse_lookup_*_upsell_purchased` booleans and read
the sectioned response's per-section `state` — `LOCKED`, `PENDING`, `NO_RESULTS`, `RESULTS`.
`POST /reverse_lookups_upsellings/consume` is **not** migrated: 0022 already placed buying and owning
upsellings out of scope, because "upselling" means a list of owned products in legacy and a
per-product credit balance in the new API, and reconciling those two is a redesign rather than a
migration. The member's credit balance, which decides whether the unlock button spends a credit or
opens the purchase dialog, stays on the legacy user for the same reason.

So a section's lock is now **read from one upstream's unlock records and written to another's**. If
the two do not share those records, a member who unlocks a section sees it stay `LOCKED` after the
refresh that follows, and every previously bought section reads as locked.

**The symptom is stated here so that nobody has to debug a screen to find it**, and the remedy if it
appears is to revert this task's gating — put the three sections back on the legacy booleans — not to
patch the sections. That is a third record-ownership question of the kind 0022 poses two of, and it is
answered nowhere.

Proceeding on it follows the precedent set three times over. The argument is 0024's and it has not got
weaker: an argument for waiting is only an argument if the wait ends, and this one has no date. The
cost of being wrong is bounded and loudly visible — sections read as locked — where the cost of
waiting is the deletion date staying unownable.

### The social-media section loses what a locked member could see

In the `LOCKED` state the new API returns neither the accounts the base scan found nor the handle it
searched by, on the reasoning that a handle is itself identifying information about the subject. Today
a member without the social-networks upselling sees those base-scan accounts plus the unlock prompt.
After this they see the unlock prompt and nothing else.

**This is a member-visible regression and it is accepted rather than worked around.** 0022's
instruction is that where the new shape is poorer than the old one, that is a finding about the API
rather than something to reconstruct on this side; reconstructing it would mean keeping the legacy
report read alive for one section, which is the state this whole track exists to leave. It is recorded
below as a finding and, following 0027's handling of its two specification defects, is not raised
upstream as part of this task.

Two smaller changes fall out of the same response and are not negotiable: progress is reported for the
section rather than per account, so the per-account spinner goes; and only accounts the API actually
resolved are returned, so the "network not found" row goes.

### The metadata endpoint gets no caller

`GET /api/v1/reverse-lookup-reports/{id}` is named by the epic's table alongside the sectioned read and
is deliberately left without a caller. Every field the four screens render is served by the sectioned
response's `profile` block, and no screen reads a report's progress, so adding a metadata call before
each sectioned call would buy a sequential round trip on every report open to answer a question
nothing asks. The row it leaves on the epic is that, not an oversight.

### Three server reads move behind one getters module, and a refusal is classified once

`src/server/getters/reverse-lookup.getters.ts` owns all three reads, through `apiServerClient` and
`unwrapApiResponse` on the generated path literals, per
[0009](0009-one-proxy-for-every-browser-call.md). Each getter answers with a **discriminated outcome**
rather than throwing an HTTP error at a screen, so the two refusals the screens act on are recognised
in one place and no screen branches on a status:

- **still being prepared** — the sectioned endpoint refuses while report progress is `PENDING` or
  `PROCESSING`; the sex-offender endpoint says the same thing as a 200 whose `status` is `PENDING`.
  Both collapse to one outcome, and the screens render one thing for it;
- **not unlocked** — both detail endpoints refuse with 403 when the corresponding upselling has not
  been spent against the report.

Anything else still rejects. That is the load-bearing part: a screen must never be able to read "the
API said no" as "there is nothing here".

**The two refusals are recognised differently, and the asymmetry is the specification's.** The
not-unlocked one is read off the API's own error code, from a set of three constants each typed
against the generated enumeration it comes from — `UPSELL_REQUIRED_ERROR` from the shared business
enumeration, `NOT_PERMITTED_ERROR` and `INSUFFICIENT_PERMISSIONS` from the declared forbidden one — so
a rename upstream fails the build rather than dropping a member who simply has not bought a section
onto an error page. Which one the backend really sends is deliberately not established; accepting all
three is what makes establishing it unnecessary, exactly as 0027's report-allowance module accepts two.
`USER_IS_NOT_ACTIVE` and `BE_INTERNAL_SERVER_ERROR` are excluded, because neither is about the section.

The in-preparation one is read off the **status**, and that is the one departure from "branch on the
error code, never on the HTTP status" in this work. It is made because there is nothing else to read:
the sectioned operation declares 200, 401 and 403 only, states its 409 in prose, and the generated
`ConflictErrorCode` carries exactly one member — `USER_EXISTS_ERROR` — which is about registration.
There is no constant to type against an enumeration, so none is invented. The rule's purpose survives:
the status is read once, in one named place, and no screen sees one.

### The sex-offender detail is re-keyed by report and owner

The sectioned response identifies a sex-offender record by the owner it belongs to
(`sexOffenders.ownersWithRecords`, a list of `{ ownerId, found }`) and not by a record identifier of
its own, and the new detail endpoint is keyed the same way. The route therefore carries the report and
owner identifiers instead of a record identifier.

Two consequences are accepted. The section's unlocked rows now show the **owner's** name rather than
the record's, which makes them consistent with the locked rows that always showed the owner's name.
And `is_empty_record` becomes the negation of `found`; owners absent from `ownersWithRecords` are the
locked branch, which is what drives the split between a link and an unlock button.

### The breach history reads one endpoint instead of two

`GET /api/v1/reverse-lookup-reports/{reportId}/data-breach` returns the phone, the report's first
photo and every breach record, and is its own gate. It replaces both of that screen's calls — the
content read and the report read that existed only to supply the gate — so the screen goes from two
requests to one and opens faster than it does today.

### Enum labels get one module, and only one value needed new copy

Every enumeration the new API returns is the upper-case form of the legacy value the translation keys
are named for. Re-keying the catalogues is not an option — there are 24, only the English one may be
edited here, and re-keying it alone would strand 23 languages — so one module lower-cases the value to
reach the key it already has, and does the lower-casing as a `Lowercase<Value>` cast so the key stays a
literal union and next-intl's typed messages check it at build time. A key assembled out of a plain
`string` compiles whatever the value is, which is the one class of error in this migration the compiler
could not otherwise see.

**The specification for this work named four values as needing new English copy. Only one of them
did.** `lineType: UNKNOWN` has no key in any catalogue. `GOOGLE`, `LINKEDIN` and `DATE_OF_BIRTH` are
already translated, in all 24 — the legacy backend's own enumerations were narrower than the catalogues
that served them. Adding `__NEW__` copy for the other three would have been dead copy, so it was not
added, and the fallback path exists for the one value that reaches it. No other locale file is touched
and the Lokalise scripts are not run.

### `SexOffenderData` is not deleted, because a second legacy screen owns it

The specification for this work states that `ReverseLookup` and `SexOffenderData` are deleted along
with the shapes only they used. `ReverseLookup` is; `SexOffenderData` is not, and this is the one place
the specification was wrong about the codebase.

The sex-offender **search** feature — `GET /sex_offender_search_reports/:id`, a different legacy
endpoint on a different screen, out of scope here and on nobody's list — reads that same type, and
reached across a directory boundary for the seven detail components the report's sex-offender screen
owned. Deleting the type would have broken it; retyping the shared components onto the new response
would have broken it too.

**The components are relocated to the screen that still needs them** — into
`memberarea/sex-offenders/report/components/` — and the report's sex-offender screen gets its own,
typed to the new response. That is the shape 0027 used when it moved the funnel's legacy creation hook
to where its callers were: two screens on two upstreams with two response shapes do not share a
component, and the duplication is the honest statement of that. `ReverseLookupLocation` and
`ReverseLookupPhoto` survive for the same reason, as the shapes that type survives on.

### Fields that disappear, and what the screens do about them

- **`age`** is not in the new response and is derived from the date of birth at render, so the
  body-characteristics card is not left with a dash.
- **`name`** on a sex-offender record is not composed by the API and is composed by the screen from
  the first, middle and last names.
- **Height and weight** are stated in centimetres and kilograms and are converted to inches and pounds
  at render. This is an American product reading American registries, and metric values there read as a
  defect rather than as a unit choice.
- **Distinguishing marks** are typed as an always-null object, documented as never populated by any
  provider and never written by the old backend either. The card that rendered them is deleted from
  this screen rather than left rendering nine dashes. The search screen keeps its copy, because its
  upstream does populate them.
- **A photo's source** is gone. The carousel's footer strip stays in place, carrying the label the card
  already showed for a source it did not recognise, so the card's height does not move ahead of the
  redesign.
- **A data-leak record's image** was already documented in the legacy type as never supplied and was
  rendered by nothing.

### Polling moves to the sectioned endpoint

The browser hook that polled the legacy report while the social search ran is replaced by one that
polls the sectioned endpoint through `$api` and the API proxy, on the generated path literal. **When to
stop is the response's business, not the caller's**: it polls exactly while the social-media section's
state is `PENDING`, and the caller says only whether to start — the server-rendered section was already
running, or the member has just unlocked it — because that is the one thing the first response cannot
say before it arrives. The section renders the polled copy when it has one and the server-rendered copy
otherwise, as the hook it replaces did.

## Alternatives rejected

**Waiting for the backend to say who owns the unlock records.** Rejected on 0024's reasoning, repeated
by 0025 and 0027. The wait has no end date; the failure is bounded and loud.

**Keeping the legacy report read alive to reconstruct the social section's locked state.** Rejected:
it keeps a legacy call for one presentation detail and leaves two paths to the same data, which is the
state 0022 exists to prevent.

**Calling the metadata endpoint alongside the sectioned one.** Rejected as a sequential round trip on
every report open, answering a question no screen asks.

**Establishing which 403 code the backend really sends, then matching it.** Rejected as work that buys
nothing, on 0027's reasoning: accepting all three is correct whichever answer comes back, and two of
the three are a dead branch either way.

**Recognising the in-preparation refusal by a guessed error code as well as the status.** Rejected:
unlike the report allowance's two candidate codes, no generated enumeration carries a plausible name
for this one at all, so an accepted code would be a guess with a probably-dead branch rather than a
hedge between two documented candidates.

**Migrating the sex-offender search screen too, so `SexOffenderData` could die.** Rejected as scope
this task does not have: it is a different endpoint on a different track position, and dragging it in
would put an unrelated screen's data layer inside a report migration.

**Re-keying the English catalogue to the new API's spelling.** Rejected: 23 other catalogues cannot be
touched here, and re-keying one would strand them.

**A fourth test seam rendering the screens.** The `_page.tsx` convention would catch a missing message
key higher than the enum-label test does. Rejected because 0022 forbids tests on screens scheduled for
replacement, and because extracting the client half of four screens is a refactor of its own riding on
a data migration.

## Consequences

- **Four screens are off the legacy client**, while remaining legacy in palette, type scale,
  components and stories. 0022 calls that the normal shape of progress.
- **Three rows close on #69.** `GET /reverse_lookups/:id`, `GET /reverse_lookups/:id/data_leaks` and
  `GET /sex_offenders_data/:id` have no callers and their types are gone. The family has one migratable
  row left — the consume call — plus the funnel's creation call, which depends on the public funnel
  rather than on the backend.
- **If the unlock-record assumption is false, every gated section on the report reads as locked.** That
  is the loudest possible failure and it is why the assumption was taken rather than hedged.
- **The sex-offender detail's URL changed shape**, from a record identifier to a report-and-owner pair.
  A bookmarked or shared old link no longer resolves and sends the member home.
- **A member without the social-networks upselling sees less than they did.** Stated above, recorded as
  a finding, not raised upstream.
- **`SexOffenderData` and two shapes beside it survive**, with the out-of-scope sex-offender search
  screen as their only caller, and seven components moved to sit beside it. That screen is a row on the
  epic that this task did not create and did not close.
- **Nine API findings are recorded and not filed upstream**, following 0027: `LOCKED` withholds the
  base-scan accounts and the searched handle; the sectioned response carries no sex-offender record
  identifier; the record carries no `age`; height and weight are metric on an American registry
  product; `marks` is typed as an always-null object; a photo carries no source; social progress is
  per section rather than per account; the sectioned operation's in-preparation refusal is
  declared nowhere and has no error code in any generated enumeration; and the data-breach section's
  `matchCount` is declared optional and nullable, on a section the API is already known to withhold
  content from while it is `LOCKED`.
- **That last finding is defended against rather than assumed away.** A count the API did not state is
  read as unknown and not as zero, because reading it as zero would hide the unlock button from exactly
  the member who has something to buy — only a zero the API actually stated hides the offer, which is
  what the flag-based gate did with a count the legacy report always carried. The section's alert still
  states a withheld count as zero, which is wrong but harmless beside a working unlock, and no copy was
  invented for a case the endpoint's own description suggests does not arise.
- **The carrier card gained a fallback the specification did not enumerate.** The new API declares the
  carrier, the country and both phone formats nullable where the legacy shape declared them present, so
  an absent one now reads as this screen's own "no record available" rather than as a bold label above
  an empty line.
- **Verification was the static checks plus the full suite**, with three new seams and 140 new tests:
  the getters module driven with the API substituted through `src/test/server-write-kit.ts`; the
  sectioned polling hook with a stubbed `fetch`; and the enum-label module walked value by value
  against the real English catalogue, with the value lists themselves proved complete against the
  generated unions at compile time, so a value added upstream fails the build rather than reaching a
  member as a raw enumeration.
