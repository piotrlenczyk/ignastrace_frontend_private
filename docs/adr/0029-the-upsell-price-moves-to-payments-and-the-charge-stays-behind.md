# 0029 — The upsell price moves to payments and the charge stays behind

**Status:** Accepted — August 2026. Continues the legacy-retirement track
[0022](0022-retiring-the-legacy-layer-on-its-own-track.md) opened, and **reverses one line of it**. It
is the third record to move a read onto the payments service ahead of any data migration, after
[0024](0024-the-subscription-read-moves-to-payments-before-the-data-does.md) and
[0025](0025-the-subscription-writes-follow-the-read-onto-payments.md), and it closes #98 on the
track's epic (#69).

## Context

**0022 put this endpoint out of scope by choice, and that line does not hold.** The epic's table lists
`GET /reverse_lookups_upsellings` as deliberately left behind, and 0022's consequences say that reading
upsells stays on legacy "until the report and upsell screens are remodelled from list-of-owned to
credit-balance". That remodel is a redesign with no date, and the read does not need it: what the
screens ask this endpoint for is a **price**, and a price is exactly what the payments service already
publishes.

**Nothing here is broken for a member, and that is the point.** Four screens read the upsell catalogue
from the legacy backend: the three funnel steps a visitor is sent through immediately after paying in
the phone-lookup checkout — PDF, data breach, sex offenders — and the member area's unlock dialog,
which five surfaces open. While that call lives, the legacy data layer has no deletion date anybody can
choose.

**Two faults ride along with it.** Each funnel step carried a hardcoded fallback of `price: 195` in
`USD`, so a product missing from the response, or an upstream that refused, was invisible: the step
quietly showed an invented amount to somebody who had just been charged. And the checkout page held two
dead assignments already calling the payments upsell endpoints and discarding both results.

## Decision

### The price is read from payments and the charge stays on legacy, knowingly

This is the principal cost and it is stated first.

The four screens read the payments service's `GET /products/upsell`. The purchase remains
`POST /reverse_lookups_upsellings` against the legacy catalogue, and the ownership check remains
`member.upsellings`. **The amount on screen and the amount charged therefore come from two different
upstreams and are not reconciled.**

While the payments instance publishes a single upsell product and every legacy key maps to it, all
three funnel steps and all five dialogs show that one product's price, and the member is charged the
legacy catalogue's. This is the same trade 0018 made at checkout and 0024 made on the billing screen,
for the same reason: the alternative is a wait with no date. It disappears when the backend publishes
real Ignastrace upsell products with real slugs and real prices, and not before.

The writes do not follow the read, and that is a departure from 0025 rather than an oversight. Buying
through `POST /products/upsell/buy` is rejected outright on [0023](0023-a-shared-technical-account-for-the-payments-upstream.md)'s
reasoning: a write raised as the shared technical account would charge that account and not the member.
0025 could move the subscription writes because cancelling somebody else's subscription is not a
charge; this one cannot.

### Identity is `metadata.productSlug`, reached through one exhaustive map

The application keeps naming an upsell by the **legacy key** — `unlimited_pdf_downloads`, `data_leaks`,
`sex_offenders`, `social_networks`, `sex_offenders_search` — because the purchase, the ownership check
and the translation namespaces all still speak that vocabulary and none of them move here. A payments
row is identified by `metadata.productSlug`, and `UPSELL_PRODUCT_SLUGS` in `src/libs/upsell-products.ts`
maps one to the other.

The map is `Record<UpsellProductKey, string>` — exhaustive over the legacy key union — so adding a key
is a build failure beside the map rather than an upsell that silently resolves to nothing. Today every
entry holds the same placeholder, `resume-ai-review`, because the payments host is still a resumewise
development instance per [0016](0016-a-second-upstream-with-its-own-client-proxy-and-specification.md).
**The day real products are published, that constant is the change and there is no other.**
`scan_pro` and `support_hotline` appear in it only because it is exhaustive; they belong to the
`/success` screen's separate legacy endpoint, which is a different task under 0022's one-endpoint rule.

### The generated type for `metadata` is unusable and is narrowed by hand

The payments specification renders a product's metadata as `Record<string, never>`, so reading
`productSlug` off it yields `never` and states nothing true about the value. One local type guard
narrows the bag beside the map. No `any`, and no edit to the generated specification, which is
regenerated from the upstream. Everything that is not an object carrying a string `productSlug` — a
bag that is absent, null, an array, or carries the field as a number — is simply not a match, because a
response that is wrong should cost an upsell rather than throw a page at somebody.

### One pure function resolves a product, and it is the only place the rule lives

`resolveUpsellProduct(rows, key)` maps the key to a slug, narrows each row's metadata, and returns the
first matching row **only if it carries a price**. Nothing else in the application knows how a payments
upsell row is identified; the four call sites do their `.find` through it and branch on `undefined`.

A priced row is returned as a narrowed type whose `price` is not optional. The specification declares it
optional, which is honest about the upstream and useless at a call site — a card cannot render an amount
it has to check for first — so the check happens once, here.

### Absence is a skip, not a guess

`undefined` from that function and a refused or unreachable payments service mean the same thing to
every caller: **do not offer this**. A funnel step redirects to the next step in the sequence it already
knows — PDF to data breach, data breach to sex offenders, sex offenders to thank-you — and the dialog
returns nothing rather than rendering. The three hardcoded product objects and the dialog's
`defaultPrice = 195` are deleted.

This mirrors 0024's treatment of a missing subscription: absence is a redirect, not an invented state.
It accepts, knowingly, that **a payments outage silently costs upsell revenue instead of announcing
itself** — which is the right way round for a screen shown seconds after a card was charged, where the
alternative to a silent skip is an error page.

### Components take the payments row and the legacy key side by side

`UpsellCard` and `UpsellDialog` receive the narrowed `GetUpsellProductResponseDto` for the price and the
legacy key separately for the purchase and the ownership check. Nothing is reshaped into the legacy
`{ key, price, currency }` object. Building one would be the adapter 0022 forbids, and it would hide
which upstream the number came from at the exact moment that matters — a reader of these components can
see the divergence above in the parameter list.

Amounts stay in cents, which is what `amount` already is and what the existing price formatter already
expects, so no formatting call site changed.

### The dialog's read becomes a query

The unlock dialog fired this read imperatively from a mount effect, as a **mutation**, through the
legacy browser hook. It is now `$paymentsApi.useQuery('get', '/products/upsell')`, which is what the
rest of the application does with a read, and what lets the several dialogs mounted on one report
screen share a single request instead of each making its own. The legacy browser hook module is
deleted rather than repointed.

The query is pinned — `staleTime` and `gcTime` infinite — following the carrier lookup's precedent, and
for a second reason this endpoint gives it: **an offer, once made, is not withdrawn underneath the
member.** Without the pin, a window refocus during a purchase could refetch a catalogue that no longer
lists the product being bought — which is exactly the shape the unconfirmed assumption below would take
— and unmount the dialog reporting the charge while the charge was in flight.

## Alternatives rejected

**A settings flag switching the funnel between legacy and payments.** Rejected on 0024's reasoning: it
leaves two paths to the same data and a flag nobody deletes.

**Waiting for the backend to publish real Ignastrace upsell products.** Rejected because that wait has
no date, which is the same argument 0024, 0025, 0027 and 0028 each made in turn.

**Moving the purchase too, so the displayed and charged amounts would agree.** Rejected outright: under
0023 the write would charge the shared technical account.

**Leaving the member-area dialog on legacy and moving only the three funnel steps.** Rejected because
0022's rule is that a task ends when the legacy wrapper is gone; it would leave two paths to one list.

**Falling back to the legacy catalogue when payments resolves nothing.** Rejected for the same reason
the `195` fallback is deleted: it is the two-paths state again, and it makes a payments outage
invisible instead of merely quiet.

**Tests on the four screens.** Rejected: 0022 holds screens on this track to `check-types`, `lint` and
`format:check`, and all four are scheduled for redesign.

## Consequences

- **One row closes on #69.** `GET /reverse_lookups_upsellings` has no callers and no wrapper. What is
  left of that legacy path family is the two writes 0022 places out of scope — the purchase and
  `/consume` — and both are recorded there, not here.
- **The price shown and the price charged diverge, and today every upsell shows one product's price.**
  Stated above, accepted, and fixed only by the backend publishing real products.
- **`/products/upsell` is assumed to behave as a catalogue, and that is not confirmed.** It is named
  "user available", it has a "purchased" endpoint beside it, and every call is made as one shared
  technical account. **If it subtracts what that account has bought, the first purchase ever recorded
  against the technical account empties the list for every member at once.** The symptom is
  unmistakable — upsells vanish from every funnel step and every unlock dialog simultaneously, for
  everybody — and it is named here so the diagnosis is one step rather than a debugging session. The
  remedy if it appears is to revert this task, not to patch the screens. This is 0027's posture: act on
  an unanswered assumption, write the assumption down.
- **A member who would have seen an invented $1.95 now sees no offer at all.** That is the intended
  change, and it is the only member-visible one when the catalogue resolves.
- **A payments outage costs upsell revenue silently.** No error page, no log a member could report, and
  no alert here — the skip is indistinguishable from a catalogue that offers nothing.
- **Two dead assignments left the checkout page**, so `/products/upsell` now has exactly the callers
  this task gives it.
- **The glossary's "Upselling" entry names a third source of the word**: the payments product
  catalogue, which is where a price is read from, alongside the funnel's list-of-owned and the new
  API's credit balance.
- **Verification was the static checks plus the full suite**, with one new seam: `resolveUpsellProduct`,
  driven with hand-built payments responses. It is the highest point all four screens pass through, it
  needs no network, no React and no session, and it carries the whole of the decision this task adds.
