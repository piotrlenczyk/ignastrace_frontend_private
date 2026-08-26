# 0039 — The standalone sex-offender search moves, and its unlock joins the sequence

**Status:** Accepted — August 2026. **Reverses the last standing line of**
[0030](0030-the-upsell-charge-follows-the-price-and-the-credit-is-spent-on-the-new-api.md): "the
standalone sex-offender search purchase keeps `POST /reverse_lookups_upsellings`, because that call
also creates the search report and answers with its identifier." The new API's spend answers with that
identifier now, so the reason is gone and the purchase follows the other four. It **contradicts the
reason** [0028](0028-the-report-reads-move-and-the-unlocks-stay-behind.md) gave for keeping this
screen's distinguishing-marks card — "the search screen keeps its copy, because its upstream does
populate them" — and deletes the card. It closes the last row
[0022](0022-retiring-the-legacy-layer-on-its-own-track.md) recorded for this family, and takes the
browser-side legacy surface from two call sites to none, after
[0035](0035-the-public-cancellation-follows-onto-payments-through-a-server-action.md) took it to two.
It changes nothing in [0009](0009-one-proxy-for-every-browser-call.md) and pays
[0023](0023-a-shared-technical-account-for-the-payments-upstream.md)'s price again, knowingly. It
builds on the prefactor that gave the spend request and its outcomes their own shape, which is the
third line of 0030 that record already names as reversed. **The legacy layer itself is not deleted
here** — after this it has no callers, and removing it is its own task, so a rollback can take one
without the other.

## Context

**One feature was keeping a whole layer alive.** The standalone sex-offender search made the last four
calls to the old backend anywhere in this application: creating a search, reading it back, buying a
candidate's record, and reading that record. Because those four existed, the client factory, the
browser hook, the server getter, the proxy under `/api/legacy` and a second backend host in the
environment all existed. Nothing about that was visible to a member and nothing was broken. The problem
is the one 0022 named: a temporary layer with no end condition is not temporary.

**The gap that blocked this has closed.** When the move was first written up, the new API modelled
sex-offender data only inside a reverse-lookup report — there was no standalone search to create,
nothing to read a search by, and no standalone report. The verdict then was that this would be a
redesign rather than a migration. The API now publishes the whole family, including the piece whose
absence was the specific reason 0030 left this one purchase behind:
`POST /api/v1/reverse-lookup-upsellings/consume` accepts `SEX_OFFENDERS_SEARCH` with a `searchId` and a
`candidateIndex`, and answers with `searchReportId` — documented upstream as the old backend's
`sex_offender_search_report_id` and as the value to navigate to the detail screen with.

**The four calls are welded together by identifiers.** The identifier the new API issues for a search
is one the old backend never saw, and both the results read and the purchase send that identifier
onward. Whether a half-moved family would work at all depends on whether the two upstreams share search
storage — the record-ownership question #74 asks about reports, never answered. So the four move
together. This is the exception 0022 allows: endpoints blocked by the same missing thing move together.

## Decision

### The four calls move, and the family reads one upstream

| What the screen does             | Where it goes                                                                           |
| -------------------------------- | --------------------------------------------------------------------------------------- |
| Run a search                     | `POST /api/v1/sex-offender-searches`                                                    |
| Read a search and its candidates | `GET /api/v1/sex-offender-searches/{searchId}`                                          |
| Unlock one candidate             | payments `POST /products/upsell/buy` + `POST /api/v1/reverse-lookup-upsellings/consume` |
| Read the purchased record        | `GET /api/v1/sex-offender-search-reports/{searchReportId}`                              |

Three of the four screens keep their legacy palette, type scale and components. Only their fetching
changes, which is the normal shape of progress on this track.

### The form speaks the new API's vocabulary, and sends only what was typed

The schema's field names are the request body's — `firstName`, `lastName`, `city`, `state`, `zipCode` —
because the track forbids an adapter translating a new shape into an old one at the boundary.

**An unfilled city, state or ZIP is left out of the request rather than sent as an empty string.** Where
the upstream distinguishes the two, results could differ, and a search for what the member typed is the
easier position to defend than a search for three empty strings. The `all` sentinel the state control
needs — a Radix `Select.Item` throws at run time on an empty-string value — resolves the same way, to no
filter at all, and never leaves this application.

**No length limits are added**, though the upstream declares them. Every message this form shows lives
on a legacy translation key and the screen is awaiting redesign, so four new strings would be copy
written to be deleted.

An empty candidate list stays a normal answer and keeps today's empty-result screen. A provider outage
keeps today's generic error toast.

### The unlock joins the sequence every other upselling already takes

The bespoke purchase dialog and its legacy mutation are deleted. Unlocking a candidate now goes through
the shared unlock dialog and the pure module that owns the order of operations — spend a credit, buy one
first only where a fresh reading of the balance says there is nothing to spend, spend again after a
purchase. `sex_offenders_search` joins the dialog's product union and the comment excluding it on 0030's
grounds comes out.

**`UPSELL_CREDIT_PRODUCTS` stops saying this upsell has no balance** and says `SEX_OFFENDERS_SEARCH`.
Three keys keep their `null` and each remains a fact: unlimited PDF downloads is an entitlement rather
than a balance, and the order-success screen's two extras exist in no other upstream at all.

**"Does this member own this upsell" becomes unaskable for the standalone search.** Its balance says how
many candidate unlocks are left to spend, which is not the same question as which candidate is open: a
member holding two credits owns no record, and a member who spent every one of theirs owns as many
records as they bought. So the ownership hook's parameter excludes the key and the compiler enforces it,
with the reason written where the exclusion is.

A successful unlock navigates to the purchased record, using the identifier the unlock answered with.

### One path unlocks and cannot navigate, and that is accepted

Where a conflicting spend is settled by a **positive** balance — the "already unlocked" answer — nothing
was spent, so no report was materialised and none is named. The screen shows its success message and the
member stays on the candidate list.

There is no way to recover the identifier afterwards. The new API publishes no list of searches, no list
of reports, and no unlocked flag or report identifier on a candidate. The old backend's purchase almost
certainly answered idempotently with the same identifier every time, so this is a member-visible
regression. It is accepted rather than worked around: the alternatives were client-side storage that
lies once a browser is cleared, or reporting an error for content that is open and paid for.

### The two server reads sit behind one module and classify nothing

`src/server/getters/sex-offender-search.getters.ts` holds both reads, through the server-side API client
and the shared response unwrapper on the generated path literals, beside the reverse-lookup getters it
copies.

**The 404 is deliberately not classified.** Both operations declare 200, 401 and 403 only, and both
document in prose that a search or a report which is not the caller's answers 404 — the same status as
one that does not exist, so that an identifier cannot be probed for whether it belongs to somebody.
There is nothing a screen could do differently with it, so it throws and reaches the error boundary,
exactly as it did through the legacy server getter. The module exists anyway, as the one place a
classification will go when one is needed, and as the seam its suite drives.

### The record screen is retyped in place, and one card goes

Every field the seven detail cards read has a counterpart in the new response, so nothing is lost —
except distinguishing marks, which the new API types as an always-null object documented as populated by
no provider it ships. That is the second finding below, and the card is deleted here as it already was on
the report screen.

Height and weight arrive metric and are rendered in inches and pounds, as the labels say. **The two
conversions are duplicated locally**, six lines, rather than reached for across a directory boundary:
which units a card is labelled in is that screen's own decision. **The enumeration label module is
shared** across that boundary, because it exists so that the upper-case-to-key lower-casing lives once
and its compile-time completeness proof is checked against the real English catalogue — a second copy
would be a second list to keep in step with the specification. The name and age helpers are not needed
at all: unlike the report-scoped detail response, this one composes both.

The seven cards stay duplicated rather than merged with their six near-identical twins on the
reverse-lookup report's sex-offender screen. 0028's reason for duplicating them has weakened — one
upstream now, two shapes differing only in nullability — but merging means editing a finished screen
from inside a task about a different one, and both are awaiting redesign regardless.

Download controls, the sticky download button and the unlimited-download entitlement behave as they do
today.

### No translation moves

Every key this feature reads stays where it is. No `__NEW__` copy is added, no locale file but English
is even considered, and the Lokalise scripts are not run. The enumeration values arrive upper-cased and
reach their existing lower-cased keys through the shared label module.

## Alternatives rejected

- **Moving the creation call alone, or any other subset.** Not a smaller version of this task, a broken
  one: the identifier the new API issues is one the old backend does not know, and both the results read
  and the purchase send it onward.
- **A second dialog and a second sequence for this one unlock.** That is what was here, kept alive by a
  response shape that no longer differs. Keeping it would have meant two places that decide whether
  money moves.
- **Remembering the search report identifier in the browser** so that an already-unlocked candidate can
  still be navigated to. It lies the moment a browser is cleared or another device is used, and a lie
  about what somebody has bought is worse than a dead end that says the content is open.
- **Reporting the already-unlocked path as a failure.** The content is open and paid for; telling the
  member it failed would be false.
- **Classifying the 404.** Both endpoints use it for two conditions on purpose, and inventing a
  distinction here would be this application asserting something the upstream declines to.
- **Merging the two sex-offender card sets.** Considered and left, for the reason above.
- **Reading ownership of this upsell from the credit balance.** It answers a different question, and the
  compiler now refuses it.

## Consequences

- **The legacy data layer has no callers left.** The client factory, the browser hook, the server
  getter, the proxy under `/api/legacy` and the second backend host are all still in the repository and
  all reachable from nothing. Deleting them is the next task, deliberately separate so a rollback can
  take this migration without it.
- **The amount displayed and the amount charged are the same number again**, off one payments price row,
  as they are for every other upsell since 0030. What that number is, is the assumption below.
- **The unlock is raised as the shared technical account**, like every other payments write. 0023's cost
  is paid here as everywhere else.
- **A finding: the new API offers no way to discover an existing search report.** No list of searches, no
  list of reports, no unlocked flag on a candidate, no report identifier on one. The dead end in the
  already-unlocked path is downstream of exactly that. Recorded, following 0027's and 0028's handling of
  their findings, rather than raised upstream as part of this task.
- **A finding: the search report's distinguishing marks are typed as an always-null object**, documented
  as populated by no provider the API ships. This contradicts the reason 0028 gave for keeping this
  screen's marks card, and the card is gone.
- **The assumption this proceeds on: every payments upsell key resolves to the same placeholder
  product.** The payments instance is a resumewise development one publishing a single upsell, so the
  credit the backend grants after a purchase need not be the credit for the product that was bought.
  Four migrated upsells already live in that state, and `UPSELL_PRODUCT_SLUGS` already documents it.
- **The symptom, which is new here because this purchase works today.** The old backend charged a real
  `sex_offenders_search` product and created the report in one step. After this change the charge lands
  on the placeholder, and if no `SEX_OFFENDERS_SEARCH` credit is granted the second spend fails: the
  member is charged and has no report, reported as a failed unlock with the payment message's retry.
  Spend-first contains the blast radius — a member who already holds a credit never reaches the purchase
  — so only the buy path is exposed.
- **The remedy if the symptom appears is to revert this task, not to patch the screen.** The condition
  that closes it is real Ignastrace upsell products in the slug map, which is already one constant with
  one line per key.
- **URLs change meaning, not shape.** The record screen still takes an identifier in the same query
  parameter; the identifier is now the new API's. A link made before the cutover resolves to nothing and
  reaches the error boundary.
- **A candidate the registry named incompletely is still selectable and still purchasable.** The name
  renders as this feature's placeholder and the photo's alternative text is empty rather than repeating
  that placeholder to a screen reader — the record is addressed by its index, not by its name.
- **Verification was the type check, the linter, the formatter check and the test suite.** Not the
  chained verify command, which runs a production build. Three seams carry it: the pure unlock module's
  suite, extended by the prefactor with the new product's request and the identifier's journey including
  the already-unlocked dead end; the upsell-products suite, whose assertion that this key names no credit
  product is turned over; and the new getters module, driven with the API substituted through the
  existing server-test kit. The search form, the candidate list, the record screen and the dialog are
  deliberately unseamed — three are screens awaiting redesign and the fourth is presentation.
