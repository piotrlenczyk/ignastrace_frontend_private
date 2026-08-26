# 0034 — The notification centre moves whole, and loses eleven languages

**Status:** Accepted — August 2026. Part of the legacy retirement track
([0022](0022-retiring-the-legacy-layer-on-its-own-track.md)), and the record that **closes a gap
0022 opened**: it names the notification centre as a family the new API models without publishing
response schemas, and that is no longer true. It also **diverges from
[0026](0026-the-activity-feed-becomes-the-list.md)** on where a paged read happens, and takes the
first field out of the mock [0013](0013-a-mocked-membership-until-the-api-publishes-one.md)
describes.

## Context

The member's notifications screen and the unread badge beside it were the last thing a member sees
on every screen that still read the old backend. Two of the five browser-side legacy calls left
belonged to the screen: the list, and the write that marked everything read.

The badge was worse than legacy, because it read no backend at all. It took `unread_count` off the
composed member, where the mocked membership answered a hard-coded three — so every signed-in
member saw the same three unread notifications in the header, for ever, whatever the screen listed.

**0022 recorded this family as a gap**, on the grounds that its three endpoints published `200` with
no content, so a migration "could be neither typed nor paginated". The generated specification now
declares `NotificationCenterResponse`, `UnreadCountResponse` and `MarkAsRead`, and states the
cursor's contract: the caller asks with `cursor` and `limit`, and the response carries
`pagination.nextCursor`. Nothing else about the gap's reasoning survives.

**What the new API answers with is not what the old one answered with.** A notification arrives
already written — a `title` and a `body` composed upstream — with an `icon`, a `createdAt` and a
`context` carrying `isRead`, a `target` and a sender. It carries no notion of "located" versus
"rejected", no location type and no phone number, so the sentence the screen used to assemble out of
a translation key and those fields cannot be reconstructed from it.

## Decision

**All three endpoints move in one task.** The track's unit is one endpoint, and its stated exception
is a group blocked by the same missing thing — which is exactly this case: one absent set of response
schemas blocked all three, and one publication unblocked them. The unread count has no legacy
counterpart and is adopted anyway, because it is what lets the badge stop reading the mock.

**The screen renders the backend's copy as plain text.** The hook that chose a translation key from
the location type and the notification kind is deleted, along with the screen's own legacy
notification shape. What the row still decides is where it leads, which icon it draws and whether it
is unread.

**One pure module is the only seam.** It turns a page of items into the screen's rows and answers
which of those rows are unread; the mutation call site is thin because it is handed the ids that
module selected. It is the activity list's mapping module again, for the same reason — the rules
worth proving are all in it — and, like it, its fixtures are built from the generated component
types, so a contract change breaks the test at compile time. Order is carried through and never
re-sorted: the page after this one is not in hand to sort against.

**The target decides the destination and the icon together, from one map.** `LocationRequest` opens
the location request detail screen and `ReverseLookupReport` opens the report, each addressed by
`targetId`; anything else, or no target at all, is a non-clickable row with the fallback icon. One
map answers both questions so a row's icon and its destination cannot disagree. The map is
deliberately partial over the API's twenty-three target types: the backend adding a kind is part of
the contract, not an outage.

**The `icon` field the API publishes is ignored.** It is an unconstrained nullable string with no
stated vocabulary — it may be one of this application's icon names, one of the backend's, or a URL.
A lookup on it would resolve to the fallback for everything while reading as though it did something.

**A notification is unread unless `isRead` is exactly `true`.** The field is optional and nullable
where the concept is binary, so it has three states for two answers. This keeps the legacy reading,
and it is the loud one: if the backend never populates it, the badge does not fall and the write
repeats on every visit with the same ids. The opposite reading fails silently — nothing ever marked,
and a count climbing without explanation.

**The write sends the unread ids of the pages actually loaded.** The old call took an empty body and
marked everything; the new one takes `{ ids: [...] }` and offers no "mark all". So "read" means
"shown to you" rather than "everything you have", which is the truer of the two claims. An empty set
sends no request. On success the count's query key is invalidated rather than set to zero by hand:
with unread notifications still behind the cursor, the count after a write is not necessarily
nothing, and only the backend knows what it is.

**The whole read happens in the browser, and this is a deliberate divergence from 0026.** That
record splits a paged read — the first page on the server, the browser carrying on from its cursor —
precisely so that no server-fetched page is handed across the boundary as initial state. Here the
write is what decides: marking read needs the ids of the first page _in the browser_, so the split
would have to hand that page across, which is the thing it exists to avoid. The screen is already a
client component in full, and its server entry keeps only its authentication and subscription
redirects.

**The page size is stated, at twenty.** `limit`'s declared default is one, which would open the
screen on a single notification and a button. Twenty is the activity list's number, so the two paged
screens in the member area behave alike, and it is used for the first page and every page after it.
Pages below the first are appended and never re-fetched while the member stays on the screen —
and nothing is kept once they leave. A cached page still says unread, because the write changes that
at the backend and not locally, so a return inside the cache's lifetime would re-render read
notifications as unread and write the same ids again. A return is a fresh read instead, which keeps
"the write repeats with the same ids" as the symptom of a backend that is not recording them, and of
nothing else.

**The badge reads the dedicated count endpoint**, with a stale time of a minute so that moving
between member-area screens is not a request per navigation. The same number arrives on the list
response's `meta` and is deliberately not the source: the badge is drawn on every member-area screen
and the list is read on one of them.

**`unread_count` leaves the member shape and both mocked payloads.** It is the first field to leave
that mock because a real endpoint arrived, which is the exit 0013 describes.

## Consequences

**Notification copy is English for eleven of the thirteen locales, and that is accepted knowingly.**
The endpoints render their own copy and their `x-locale` states two values, `en` and `es`. Members
reading in any other language see English where they see their own language today. It is recorded as
a gap against the upstream rather than routed around: there is no local composition left to fall
back to, because the fields it was composed from are not on the response. `x-locale` is not
special-cased — the browser client attaches the document's language as it does on every other call.

**A notification about anything but a location request or a report is a dead row.** It shows its
title, its body and its date, and does not open. The backend is believed to emit only those two
kinds today; if it emits a third, the row is degraded rather than broken.

**Two rows that used to be told apart by colour are not any more.** The screen drew one tint for a
located notification and another for a rejected one, from a `kind` the response does not carry. Every
row now gets one treatment.

**The five keys the screen stops reading are left in place.** They live in twenty-three locale
catalogues and only the English one is this repository's to edit; every task on this track has
changed that file by addition only. They die with the screen's legacy copy at its redesign.

**The browser-side legacy surface falls from five call sites to three** — the standalone sex-offender
search, its upselling purchase, and the public subscription cancellation. The legacy proxy's own
commentary is corrected to say so, because that number is the bounding argument for keeping an
unspecified proxy alive.

**The screen is on the new API and legacy in every other respect** — old palette, old type scale, old
components, no story. That is this track's intended end state, not an oversight.

## Findings about the new API's notification contract

Listed here rather than reported and forgotten, following 0027 and 0028.

- `limit` defaults to **1**. Almost certainly an upstream mistake; stating the page size explicitly
  costs nothing either way.
- `icon` is an unconstrained nullable string with no stated vocabulary.
- `context.isRead` is optional and nullable where the concept is binary.
- `x-locale` renders `en` and `es` only, on endpoints whose entire payload is rendered copy.
- There is no "mark all as read": the caller must enumerate ids it may not have fetched.
- `NotificationCenterResponse.meta` carries the same unread count the dedicated endpoint answers, so
  one number has two sources.

## Assumptions, and the symptom if each is false

1. **The backend falls back to English for an `x-locale` outside `en` and `es`.** If not: blank or
   malformed copy for most members, rather than English.
2. **`targetId` is the identifier the destination screen accepts** — the location request read for one
   target type, the report screen for the other. If not: a row opens an empty screen.
3. **`context.isRead` is actually populated.** If it is always null: the badge never falls, and the
   write repeats on every visit with the same ids.
4. **`limit`'s default of 1 is a mistake rather than intent.** Costs nothing either way, because the
   size is stated.
5. **Marking an already-read notification is harmless.** The write is expected to be idempotent.
6. **The backend emits notifications only about location requests and reverse-lookup reports.** If it
   emits others, they appear as non-clickable rows with the fallback icon.

## Alternatives considered

**Reconstructing "mark all as read" by walking the cursor before writing.** Rejected: an unbounded
number of upstream calls inside one screen open, for the members with the most history — the cost
0026 rejected for the same reason.

**Reading the first page on the server, as 0026 does.** Rejected here for the reason given above: the
write needs the first page's ids in the browser, so the split would cost what it buys.

**Reading `isRead` as "unread only when it is exactly `false`".** Rejected: it fails silently. The
reading adopted fails visibly, on the first visit.

**Taking the count off the list response's `meta`.** Rejected: the badge is on every member-area
screen and the list is read on one.

**Keeping the fetched pages cached between visits, and marking the read ones in the cache by hand.**
Rejected as the more moving parts for the same result: dropping them makes the next visit read the
truth from the backend, where a hand-written cache would have to be kept honest by this screen for
as long as it survived.

**Guessing a vocabulary for `icon`.** Rejected: a lookup that resolves to the fallback for every
value is worse than no lookup, because it reads as though the field were being honoured.

**Deleting the five orphaned translation keys.** Rejected as out of scope, on the translation rule
this repository works to: the catalogues are the translation team's, and this one is edited by
addition only.
