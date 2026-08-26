# 0032 — The order-success extras move to payments, and the cart dissolves

**Status:** Accepted — August 2026. Closes the last two legacy upselling calls on the order-success
screen, and with them two rows of [0022](0022-retiring-the-legacy-layer-on-its-own-track.md)'s
out-of-scope table. It **reverses one line of**
[0030](0030-the-upsell-charge-follows-the-price-and-the-credit-is-spent-on-the-new-api.md): the
payments service's purchased-products endpoint, which that record said would deliberately never be
asked, **is asked here**, in one place and for one reason. It changes nothing in
[0023](0023-a-shared-technical-account-for-the-payments-upstream.md) and pays its price again,
knowingly. It closes #103 on the track's epic (#69).

## Context

**The last screen on the legacy upselling endpoint.** The order-success screen — where a member who
has just paid is offered `scan_pro` and `support_hotline` — read its offer from
`GET /upsellings` and wrote its purchase to `POST /upsellings`. Every other upsell price in the
application has come from the payments catalogue since
[0029](0029-the-upsell-price-moves-to-payments-and-the-charge-stays-behind.md), and every other upsell
charge from the payments service since 0030. This screen quoted an upstream nothing else quoted.

**It gated on a fixture.** Whether a member already owned these extras was answered from the composed
member's list of extras, which is the mocked membership of
[0013](0013-a-mocked-membership-until-the-api-publishes-one.md) for every key except unlimited PDF
downloads. So the screen deciding whether to sell was asking an invented question — the fault 0030
removed from the funnel steps and the report sections, surviving here only because this screen was a
separate task.

**Its two extras exist in no other upstream.** The new API's credit balances cover three products and
neither of these is one of them; `UPSELL_CREDIT_PRODUCTS` already recorded both as `null`. So 0030's
pattern — buy on payments, spend a credit on the new API — only half applies. There is a purchase, and
there is nothing to spend.

**The purchase was one call carrying both keys.** `POST /upsellings` takes a list. The payments
service's buy operation takes a single price identifier, and nothing on that upstream buys two
products at once.

## Decision

### The offer comes from the payments catalogue, read once

`GET /products/upsell`, server-side, through `getUpsellProducts`, and both keys resolved from that one
response by `resolveUpsellProduct` — the same resolver the three funnel steps and the unlock dialog go
through. "How a payments upsell row is identified" stays one answer in one place, and the amount on a
card is the amount its buy call charges, because the card sends `price.id` off the row it displayed.

The pinned browser query the funnel and the dialog share is not used. This screen is a server render
and stays one, so the redirect decision is taken before anything renders and no card shows a loading
state it did not have before.

### Ownership comes from the payments service's purchased-products endpoint

`GET /products/upsell/user`, by its `purchasedCount`. **This reverses 0030.** That record, and the
glossary entry beside it, said this endpoint is deliberately never asked, because every payments call
is raised as the shared technical account of 0023 and its per-user answers are that account's.

**That objection is not answered. It is accepted**, because this is the only upstream in the system
that answers anything at all about `scan_pro` and `support_hotline`, and because the alternative is
keeping the fixture. It applies to these two keys and to this screen; `useOwnsUpsell`, which answers
for every other upsell, still does not ask it.

The guard is an **OR over the two keys at a count of one or more**, reproducing what the screen did
with the composed member's list of extras. A member who bought only one of the two is therefore never
offered the other again; that is accepted rather than overlooked.

### Every payments failure resolves to the thank-you screen, and the guard fails closed

A catalogue that refuses, a catalogue that prices neither extra, and an ownership read that refuses all
render the thank-you screen — the same branch the upsells feature flag already takes. No error page,
no empty offer, no invented price. Seconds after a card was charged, a failure that has nothing to do
with that payment is the wrong thing to show.

On ownership this is deliberately **fail-closed**, which is the opposite posture from 0029's catalogue
rule: an unreadable count is not treated as "owns nothing", because the wrong answer in that direction
re-sells an extra to somebody who has already paid for it. `ownsAnyUpsell` therefore answers "owns" for
an absent response, so a caller that does not branch on the absence itself still fails closed.

**The trap here is the client's own shape.** `openapi-fetch` answers a refusal with an absent `data`
and no exception, so a getter that defaults that to an empty list reports "owns nothing" for every 401,
403 and 500 — and while 0023 stands, an environment with no payments credential sends this call
unauthenticated, which makes a refusal the _ordinary_ answer rather than the rare one. The body is
therefore returned exactly as it arrives, and the `catch` covers only the transport failing outright.

### The cart dissolves; each card buys itself

The order-details summary with its running total, its add and remove actions, and the one bottom button
that wrote both keys in a single call are **deleted**. Each card carries its own buy button, its own
failure and its own bought state, and what remains beside them is the existing way off the screen to
the thank-you screen.

This is a change of interaction on a screen that is otherwise left legacy, and it is chosen knowingly.
The original intent was to keep the single button and fire two buy calls in sequence; the hole in that
is a member charged for the first extra when the second is declined — retrying the button charges the
first again, and abandoning it leaves them without the second. Per-card buttons remove the hole rather
than manage it.

**The single button can come back the day the payments service grows an operation that buys several
products in one call.** That is the condition, and it is the only one: the interaction changed because
of an upstream limit, not a preference.

### The purchase reuses the existing sequence and the existing surface

`buyUpsell` through `useUpsellUnlock().purchase`, and each card wrapped in its own
`UpsellPurchaseSurface` keyed on its own price row's provider account — the funnel card's precedent, so
a 3-D Secure challenge is presented for the card that was pressed. Buy, and where the answer carries a
client secret, confirm in the browser; a client secret arriving where no Stripe instance exists is a
failed purchase, so Adyen and NMI markets are still offered the extras and still take a
non-authenticated charge. The order of buy and confirm is not reinvented for a fourth call site.

**Nothing is spent on the new API.** Neither key maps to a credit-balance product, so the sequence is
the purchase alone. Both maps in `src/libs/upsell-products.ts` are unchanged: both keys keep their
`null` in the credit map and both keep pointing at the placeholder slug.

### The unreachable policy is deleted, and so is the screen's own plumbing

`hasUpsellings` and the `hasUpsellings` option on `getSubscriptionRedirect` had no callers left once
the guard moved; both are gone, with their cases in the redirect test. So are the legacy purchase hook,
the order-details component, the added-product helper and the screen's local `Product` type — the
screen has one path through it.

### The new copy is new keys

The card's buy button and its bought state are new keys under `__NEW__`, in English only. The existing
`Add` and `Added` keys are **not** re-pointed: a button that charges a card does not carry the copy of a
button that filled a basket. The existing payment error copy is reused.

## Alternatives rejected

**Keeping the single button with two sequential buy calls.** A member charged for the first extra when
the second is declined, with no way to retry that does not charge the first again. Rejected on the hole,
not on taste.

**Keeping the fixture for ownership.** It is 0013's mocked membership, so the screen would go on asking
an invented question after both of its real calls had moved. That is the fault 0030 removed everywhere
else.

**Treating an unreadable ownership count as "owns nothing".** It is the reading that keeps the offer up,
and it is the one that re-sells an extra to somebody who already paid.

**Re-reading the payments count after a purchase to decide the other card's state.** Both keys resolve
to the same placeholder product today, so a re-read after buying the first card would report the second
as bought too. The bought state is local to the card that bought.

**Waiting for real Ignastrace upsell products, or for the technical account to end.** Neither has a
date — the argument 0024, 0025, 0027, 0028, 0029 and 0030 each made in turn.

**Tests on the screen, the cards or the getters.** 0022 holds screens on this track to `check-types`,
`lint` and `format:check`, and this screen is scheduled for redesign. The one decision this task adds
is `ownsAnyUpsell`, which is pure and tested.

## Consequences

- **The order-success screen is off the legacy client entirely**, and `GET /upsellings` and
  `POST /upsellings` have no callers left.
- **The symptom to recognise, named in advance: the screen stops selling to everybody at once.** Both
  keys resolve to the same placeholder product on the resumewise development instance, and every
  payments call is raised as one shared technical account — so the purchase count this guard reads is
  shared by every member and by every upsell in the application. The first purchase ever recorded
  against that account, from a funnel step or an unlock dialog or anywhere else, raises the count to
  one, and from that moment every member is sent straight on to the member area and nobody is offered
  these extras. The diagnosis is this record; the remedy is to **revert the guard**, not to patch the
  screen.
- **The backend's listener may grant a credit nothing can spend.** It observes the payments service and
  grants against the product that was bought, which here is the placeholder — and neither of these two
  extras has a credit balance to spend it from. That is a consequence of the placeholder catalogue, not
  of this task, and it ends when real products are published.
- **A member who bought one extra is never offered the other again**, because the guard is an OR.
- **A payments outage on this screen costs an offer rather than an error page**, which is 0029's choice
  kept and the funnel's quiet failure mode.
- **Buying is now two decisions rather than one**, and a member who wants both presses twice. The
  condition for undoing that is recorded above.
- **The mocked membership keeps its invented list of extras**; only this screen stopped reading it.
  Deleting the mock is 0013's.
- **Analytics is unmoved.** The purchase event still reports the trial price and the thank-you screen
  still reports the extras' total from the fixture.
- **The legacy surface still does not close.** The standalone sex-offender search and its purchase, the
  notification centre, the cancellation write and the legacy reverse-lookup creation keep the legacy
  client and its proxy alive, so #69's closing task still cannot run.
- **Verification was `check-types`, `lint`, `format:check` and the full suite.** This is a place where
  money moves, so a manual pass through both cards on a configured environment is worth a developer's
  time where one is available.
