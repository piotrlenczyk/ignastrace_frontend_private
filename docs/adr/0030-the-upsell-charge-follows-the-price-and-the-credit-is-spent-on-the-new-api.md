# 0030 — The upsell charge follows the price, and the credit is spent on the new API

**Status:** Accepted — August 2026. Completes what
[0029](0029-the-upsell-price-moves-to-payments-and-the-charge-stays-behind.md) started and **reverses
its last standing line** — "moving the purchase too … rejected outright" — together with two rows of
[0022](0022-retiring-the-legacy-layer-on-its-own-track.md)'s out-of-scope table: the reverse-lookup
upselling purchase, and, for the funnel only, the upselling create call. It takes the credit spend
[0028](0028-the-report-reads-move-and-the-unlocks-stay-behind.md) left behind, closing that record's
"the unlocks stay behind". It changes nothing in
[0023](0023-a-shared-technical-account-for-the-payments-upstream.md) and pays its price again,
knowingly. It closes #100 on the track's epic (#69). **Superseded in one section by
[0031](0031-spend-versus-buy-is-settled-from-the-credit-balance.md):** the error code this record
named as the signal for "no credit left" is not one the spend ever sends, so everything below about
that code and the list holding it — the assumption stated as pointing the safe way included — is
history rather than the current state. The refusal is now recognised by the envelope's status and
told apart from its identical twin by a fresh reading of the balance. The spend-first order, and
"reported, not retried", stand. **One further line has since been reversed by
[0032](0032-the-order-success-extras-move-to-payments-and-the-cart-dissolves.md):** the payments
service's purchased-products endpoint, which this record says is deliberately never asked, **is asked
by the order-success screen**, whose two extras exist in no other upstream. That is one screen and two
keys; everywhere else the rule below still holds.

## Context

**A member was shown one amount and charged another.** Since 0029 every upsell price on screen is read
from the payments service's product catalogue, while the purchase is raised against the legacy
catalogue. The number on the unlock dialog and the number that leaves the card come from two different
upstreams and are not reconciled. That was 0029's principal accepted cost, and it is the reason this
record exists.

**0029's reason for leaving the purchase behind no longer holds on its own terms.** It rejected
`POST /products/upsell/buy` on 0023's reasoning: a write raised as the shared technical account would
charge that account and not the member. But
[0021](0021-the-checkout-island-takes-every-payment-but-one.md) already charges **every subscription**
through the payments service as that same account. An upsell charge raised there is not a new class of
risk; it is the risk the initial sale already accepted.

**The funnel's "already purchased" check was reading a fixture.** The composed member's list of extras
is the mocked membership of [0013](0013-a-mocked-membership-until-the-api-publishes-one.md) for every
key except unlimited PDF downloads — `SUBSCRIBED_MEMBERSHIP` simply declares `sex_offenders` and
`data_leaks` owned. So a funnel step deciding whether to offer an upsell, and a report section deciding
whether to spend or to sell, were both asking an invented question. The report sections' answer was
always yes, which meant every unlock attempted a spend first whether or not anything was there to
spend.

**Two payment stacks were alive.** 0021 gave the checkout island every payment in the application
except one: the upsell dialog's "update your card" step still ran the old legacy Stripe form. That form
was the last thing keeping its credit-card and wallet children, the confirm-payment hook, the payments
payment-method mutation hook, and three build-time Stripe publishable keys in the environment.

## Decision

### The charge moves; the identity does not

The purchase is `POST /products/upsell/buy` on the payments service, raised as the shared technical
account, knowingly, on 0021's reasoning. What connects a charge to a member is not the credential —
it is the backend's own listener, which observes the payments service and grants the member a credit.
**Confirmed with the backend rather than assumed**, and it is why nothing here grants anything.

The amount charged is the amount displayed, because the request body is the `price.id` off the row
`resolveUpsellProduct` returned — the same row whose `amount` is on the button. 0029's divergence
closes.

### The order of operations is spend-first, and one pure module owns it

`src/libs/upsell-unlock.ts` takes injected `spend`, `buy` and `confirm`, plus the product and report
identifiers, and answers with a discriminated outcome: `unlocked`, `purchase-failed`,
`confirmation-failed`, `spend-refused`. No network, no React, no session inside it. This follows
`resolveUpsellProduct`'s precedent — the one seam 0029 added, for the same reason.

For a credit-balance product the order is: attempt the spend; where the new API refuses **for want of a
credit**, buy; where the buy answers with a client secret, confirm in the browser; then attempt the
spend again.

- **A spend refused for any other reason is a failure and does not lead to a purchase.** A spend that
  failed because the report is not the caller's would not start succeeding once a credit was bought,
  and buying anyway would take money for nothing.
- **A second spend that is refused is reported, not retried.** That is the symptom named below.
- Both halves are behind one button, so a member holding a credit is never charged again even if the
  balance a screen read a moment ago was stale.

`buyUpsell` is the same sequence without the spends, and it is the whole of what a funnel step does and
the whole of what unlimited PDF downloads does.

### "For want of a credit" is one undeclared error code, and the list errs towards not charging

The consume operation documents only 401 and 403, so the condition is read out of the envelope's
`errorCode`, of which exactly one qualifies: **`UPSELL_REQUIRED_ERROR`**, which names this condition in
the API's own vocabulary. Anything that is not that envelope — a gateway's HTML, or the proxy's own
refusal, which arrives in the same envelope under a `PROXY_*` code — is not an empty balance.

**`ENTITY_NOT_FOUND_ERROR` was considered and deliberately excluded.** It is the tempting second
candidate and the dangerous one: the entity a consume request names is the _report_, so it far more
plausibly means "not your report" than "no credit". Admitting it would mean a member whose spend failed
for an unrelated reason is charged, and the second spend then fails — precisely the charge-with-no-credit
this sequence exists to prevent, and precisely what the epic's story 17 forbids.

**Which leaves an assumption, stated rather than hidden, pointing the safe way.** If the backend refuses
an empty balance with some third code, the buy path is never reached: the dialog reports a failed payment
and **no money moves**. That is loud, costs nothing, and the fix is one entry in
`EMPTY_BALANCE_ERROR_CODES`. The opposite error — a list too wide — would cost a member money, so the
list is deliberately too narrow instead.

### Ownership comes from whichever upstream actually knows

- **The three credit-balance products** — data breaches, sex offenders, social networks — from
  `GET /api/v1/reverse-lookup-upsellings/credits`. A positive balance spends, zero buys, and the same
  read is what a funnel step uses in place of the composed member's list of extras. Not pinned, unlike
  the catalogue read beside it: a balance is exactly the thing that changes while somebody reads a
  report, and it is invalidated after every spend and every purchase.
- **Unlimited PDF downloads** from `unlimitedPdfDownloadsUnlocked` on the current-user response — the
  one commercial fact the account service answers, and the one concept both upstreams share. A
  successful purchase invalidates that query and refreshes the route, so the download button stops
  offering what the member now owns.
- **Not** the payments service's own `GET /products/upsell/user`. Every payments call is made as one
  shared technical account, so its per-user answers are that account's: reading ownership there would
  make one member's purchase everybody's unlock, and somebody else's purchase the thing that unlocked
  a feature for them.

### Product identity keeps two maps, side by side, both exhaustive

`UPSELL_PRODUCT_SLUGS` stays, and gains a sibling: `UPSELL_CREDIT_PRODUCTS`, mapping every legacy key
to the new API's credit-balance product or to `null`. Both are `Record<UpsellProductKey, …>`, so adding
an upsell key is a build failure beside both maps rather than an upsell that silently resolves to
nothing. The four `null`s are facts and not omissions — an entitlement rather than a balance, a
purchase that stays legacy, and two keys belonging to a different endpoint entirely.

The application keeps naming an upsell by its **legacy key**, because the translation namespaces and
the two remaining legacy writes still speak that vocabulary.

### 3-D Secure is Stripe's, and only Stripe's

`UpsellPurchaseSurface` wraps a purchase in a Stripe Elements root **only** where the price row's
provider account is Stripe and publishes a public key, and initialises Stripe at all only then. The
key comes off that row, through the same `mapProviderAccount` the checkout island's prices go through,
so following the catalogue onto another provider account is a configuration change and not a deploy.

No card is collected: the service charges the instrument it holds, and the instance is used for
`confirmCardPayment` alone. Where the surface is not a Stripe one the confirmation answers
`unavailable`, and the pure module turns that into `confirmation-failed`. **Adyen and NMI therefore
have no confirmation path here**: the offer is still made and a non-authenticated charge still goes
through, and a client secret arriving where there is nothing to confirm on is a failed purchase rather
than a spinner that never resolves.

### The failure path loses the card change and keeps the retry

The dialog's "update your card" step is **deleted**. Through the payments service it would change the
card on the shared technical account's subscription, which is not this member's card. Out of retries
the message now closes instead, on an existing key. The existing payment message and its three retries
stay — a retry is a second invocation of the same sequence. Both reference implementations have
neither the message nor the retry, and the retry is the one place this task goes beyond them,
deliberately.

### The old Stripe form dies whole

Deleting that step orphaned a single-rooted chain, and all of it is gone: the upsell checkout form, the
legacy Stripe form, its credit-card and wallet children and the wallet button under them, the
confirm-payment hook, the payments payment-method mutation hook and its tests, the Stripe form's zod
schema, and the environment-keyed Stripe loader in `src/libs/stripe.ts`. The three
`NEXT_PUBLIC_*STRIPE*` variables leave the environment example and the deployment notes. What is left
is the provider-account-keyed loader, and one way to take a card.

The checkout island and the server-side payment-method call it makes for a pending subscription are
untouched.

### Both writes are query-library mutations

Neither sets a cookie, redirects, nor changes server-rendered output on its own, so neither is a server
action. `useBuyUpsellProductMutation` and `useConsumeUpsellMutation` are single-expression wrappers
over the generated clients, beside the existing payments and API hooks; `useUpsellUnlock` is the
adapter that turns their rejections into the pure module's vocabulary. Where a spend does change a
server render the call site follows it with `router.refresh()`, and the credit balances are invalidated
in the adapter because every path through it moves them.

### What stays legacy, and why the legacy surface does not close here

- **The standalone sex-offender search purchase** keeps `POST /reverse_lookups_upsellings`, because
  that call also _creates the search report_ and answers with its identifier, which the payments
  purchase does not. Its hook moved to that screen's own directory with it, and it renders the same
  offer and message components every migrated upsell does, so a member sees no difference. This is the
  one place 0029's divergence survives.
- **The `/success` screen's extras** keep their own legacy list and create calls. Neither
  `scan_pro` nor `support_hotline` has a counterpart in the new API's credit balances, and the screen
  is a separate endpoint — hence a separate task. _That task is
  [0032](0032-the-order-success-extras-move-to-payments-and-the-cart-dissolves.md): both calls have
  since moved, and with them the ownership read this record placed off limits._

So the legacy browser client and its proxy stay alive, and this task does not let the retirement epic's
closing task run.

## Alternatives rejected

**A feature flag switching between the legacy and the payments purchase.** Two paths to one write, and
a flag nobody deletes — the same reason 0024 and 0029 each gave.

**Reading ownership from `GET /products/upsell/user`.** It is the payments service's own answer and it
would be the technical account's. Rejected on 0023.

**Deciding spend-versus-buy from the balance alone, with no spend-first attempt.** A balance read a
moment ago can be stale — a second tab, another device, a spend that raced — and every stale reading
of it would charge a member for something already theirs.

**Waiting for real Ignastrace upsell products before moving the charge.** Rejected because that wait
has no date, which is the argument 0024, 0025, 0027, 0028 and 0029 each made in turn.

**Keeping the "update your card" step against the payments service.** It would change the shared
technical account's card. Rejected on 0023, and it is what let the old form be deleted whole.

**Tests on the screens or the hooks.** 0022 holds screens on this track to `check-types`, `lint` and
`format:check`, and the hooks are single-expression wrappers over generated clients. The pure module
and the two identity maps carry every decision this task adds.

## Consequences

- **The amount displayed and the amount charged are the same number**, read off the same price row, on
  every upsell but the standalone search.
- **Every legacy key still resolves to one placeholder product** on the resumewise development
  instance, so the credit the backend grants need not correspond to the section that was bought. This
  is 0029's accepted cost with the same removal condition — real Ignastrace products published, at
  which point `UPSELL_PRODUCT_SLUGS` and one environment value are the whole change — and the charge
  moving here makes it a cost in money rather than only in display.
- **The symptom of the two upstreams disagreeing is a charge that succeeds while the section stays
  locked.** It means the backend's listener did not grant the credit. The remedy is to revert the
  purchase to legacy, not to patch the screens.
- **`UPSELL_REQUIRED_ERROR` as "no credit left" is unconfirmed, and wrong in only one direction.** If a
  genuinely empty balance is refused with some other code, the symptom is an unlock dialog that reports
  a failed payment without ever charging anything — and a member who cannot buy. That is the failure
  this record chose over its opposite.
- **"Already purchased" stops being a fixture**, in the funnel and on the report. A report section now
  offers the dialog to a member who has no credit, where it used to attempt a spend that could only
  fail.
- **A payments outage still costs an offer rather than throwing an error page**, which is 0029's choice
  kept: the funnel step redirects and the dialog does not render.
- **A funnel step no longer offers a credit-holder the purchase at all.** The ownership read is at
  render, so the button says "already purchased" before it is pressed rather than after — where the
  fixture it replaces could only answer on the click.
- **Stripe.js is not loaded on a report screen until an unlock dialog is opened.** Five of them sit on
  one report, and each purchase surface would otherwise fetch a third-party script for a purchase
  nobody asked for. The gate latches on rather than tracking the dialog, because the payment message
  outlives the offer it reports on.
- **Two legacy upselling writes survive**, and #69's closing task still cannot run. _One of the two,
  the `/success` screen's create call, has since gone with 0032; the standalone search's remains._
- **The application has exactly one way to take a card**, and no build-time Stripe key. A new screen
  cannot be wired to one, because there is none.
- **The glossary's "Upselling" entry names the purchase's new home** alongside the three senses it
  already distinguishes.
- **`user.purchase_info.data_leaks_upsell_available` and `…sex_offenders_upsell_available` have no
  readers left.** They stay in the mocked membership, which is 0013's to delete.
- **Verification was `check-types`, `lint`, `format:check` and the full suite.** No browser walk is
  required by the retirement track's rules; this is the one place in that track where money moves, so a
  manual pass through one dialog and one funnel step on a configured environment is worth a
  developer's time where one is available.
