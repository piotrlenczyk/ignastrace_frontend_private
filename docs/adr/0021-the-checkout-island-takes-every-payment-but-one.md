# 0021 — The checkout island takes every payment but one

**Status:** Accepted — August 2026. Completes what
[0019](0019-the-parked-checkout-island.md) started on one screen and
[0018](0018-checkout-quotes-payments-and-charges-the-legacy-api.md) stopped short of on three. It
corrects sentences in both; those corrections are listed under
[What this falsifies](#what-this-falsifies).

## Context

Three screens took a payment in this application, and all three fed one legacy payment form. One of
them — the phone-lookup checkout — moved onto the payments service and the checkout island. The other
two did not: the reverse-lookup checkout and the reactivation dialog on the billing screen quoted a
price out of the payments catalogue and then raised the charge on the legacy API.

0018's two accepted risks were open on exactly those two screens. The amount displayed came from one
catalogue while the amount charged came from another, and the payment method was created against the
catalogue's provider account while the charge was raised against the legacy API's own — different
accounts mean the payment simply fails. Neither screen could offer Adyen at all, so a market the
catalogue prices through Adyen had no working payment form on either.

The legacy form was also why those two screens could not be finished. It knew about reactivation,
skipping a trial, reverse-lookup funnels, phone numbers and order-confirmation e-mails, because it
grew a flag for every screen that ever used it. While those two screens held it, neither it nor the
pricing helpers that existed only to feed it could be deleted.

Adopting the island on two more screens is not a matter of rendering it twice, either. It knew where
a completed payment goes, as a route — which is a fine answer for two full-page checkouts and no
answer at all for a dialog that has to refresh the screen behind it and close.

## Decision

**Both screens adopt the island, and the island stops knowing where a payment goes.** The success
route is replaced by a callback. The invariant part of a completed sale stays inside the island and
runs on every screen — the checkout attempt is discarded and the placed order is reported, with the
amount, currency and product taken off the price row the charge was raised against — and then control
returns to the screen. The phone-lookup checkout navigates, as it did. The reverse-lookup checkout
creates the visitor's reverse lookup and then navigates. The reactivation dialog refreshes the
billing screen and closes. This is the natural extension of 0019's decision to make the success route
an input rather than a derivation: the island now asks a screen for a price row, a submit label and
what to do on success, and contains no branch named after any of them.

One price row is displayed and that same row's identifier is what the payments service charges, so
0018's two accepted risks close on the last two screens carrying them, and Adyen becomes reachable
from both.

**The placed-order report is unconditional, deliberately unlike the integration this follows.** That
one fires the report only where a checkout-attempt cookie exists, which silences it in its own
settings modal, because its cookie carries the event identifier pairing the two halves of a sale in
the marketing platform. Our checkout attempt carries no identifier and the reported product comes off
the price row rather than out of the cookie, so the same guard would protect nothing — and it would
make reporting a sale on one funnel depend on a cookie the other funnel writes. Reactivation is
reported like any other sale.

**Reactivation resolves the non-trial product strictly, and it is the one price resolution that
catches.** Someone who has subscribed before is not eligible for a trial, so a new entry point on the
pricing reader composes the currency fold with a strict selection of the non-trial four-week product
and throws where the catalogue publishes none. It deliberately does not reuse the checkout resolver,
whose fallback prefers the trial product — the rule that made 0018's member read survivable was
precisely that reactivation is charged the full amount whichever catalogue answered, and a fallback
here would break it. The billing screen catches that failure, logs it, and renders without the
reactivation offer: a member reading their history, their dates and their cancellation options must
not lose all of it to a price they are not being offered. Everywhere else, a price that cannot be
resolved still reaches the error boundary, as 0018 decided.

**Reactivation's consent paragraph is derived from the price row, not from the fact that it is a
reactivation.** The island reads the row's trial days, so a non-trial row produces the subscription
wording. The reactivate-specific string is left in the messages file, unused: it is the same sentence
minus the terms and privacy links, so the island's rule is strictly better. Consent copy stays on the
legacy keys, as 0019 decided.

**The reverse-lookup checkout keeps buying what it bought, and keeps its distance from the checkout
attempt.** It quotes the trial product through the reader's existing plan-to-product translation. It
neither reads the funnel plan nor records a currency, so a plan chosen in the other funnel cannot
raise the price here. Its success handler creates the reverse lookup through the legacy call the
screen already made — the whole downstream funnel reads that record from the same upstream, so
creating it on the new API's own endpoint would strand the report the visitor is walking towards — and
navigates onward either way, including when the creation is refused, which is what the screen did
before.

**A returning Adyen shopper is recognised on both checkout screens and in the dialog.** A
redirect-based 3-D Secure challenge returns the visitor to the screen they left with the challenge's
result in the address. Both full-page checkouts now skip their authenticated-visitor redirects when
that parameter is present — the pattern both reference integrations use, and the thing that closes
0019's third accepted risk rather than copying it onto a second screen. The dialog has to go further:
it opens itself when both signals are present, the recorded redirect source and the result in the
address. Those are read after mounting rather than during the render, because neither is visible to
the server render and a state initialiser that disagreed with it would break hydration on a screen
with a payment to finish.

Both conditions are pure functions over their signals rather than code that reads a browser: the one
a server render makes, over the address alone, and the one the dialog makes, over the address and the
recorded source together. They sit beside each other in the redirect helpers and each is tested
there, which is what makes the trickiest condition in this change something a reader can check rather
than something only a click can prove.

**A resumed redirect is not a second start of the funnel.** Both checkout screens report a started
checkout to the marketing platform on render. A returning shopper is finishing the checkout they
started before they left, so that report is skipped on the same condition the guards stand aside on —
otherwise every card that asks for a challenge counts twice at the top of the funnel.

**While a redirect is being resolved the dialog cannot be dismissed.** The lock follows the
resolution actually starting rather than the intention to resolve one, which is the deliberate
direction: a redirect result that no mounted payment component claims resolves nothing, and locking on
the intention would leave a member shut inside a dialog that is finishing nothing. Every other moment of a
payment is covered by the island's own overlay, which sits above the dialog; a payment being finished
on arrival raises no overlay, and a click on the backdrop would unmount the island with a charge in
flight. The island reports that one state upward — generically, as "a redirect is being resolved", not
as anything about dialogs — and a screen that cannot be dismissed passes nothing and is unaffected.
This is an addition over the reference integration, which does not handle it.

**One screen keeps the legacy form.** The payment-method update dialog on the reverse-lookup report
screen still renders it, so the form, its card and wallet components and the payment mutation behind
it all stay. 0018 already records that they die with that screen. The branches in them that are now
unreachable — subscription creation, subscription sync, reactivation, skip-trial, reverse-lookup,
order-confirmation e-mail — are left verbatim rather than pruned: editing code on its way out buys
nothing and risks the one screen still using it.

**What is deleted is what nothing renders.** The legacy checkout form, the checkout product resolver
and the amount-due helper go, with their cases in the pricing tests. The security-reassurance row
those screens showed was inside the deleted form; it is extracted rather than lost, still on legacy
keys, and is re-keyed with the screens that render it.

## What this falsifies

Records are immutable, so the sentences below are corrected here rather than edited there.

- **0019's "The island is live on one screen."** It is live on three: both checkouts and the
  reactivation dialog.
- **0019's "The reverse-lookup checkout and the reactivation dialog keep the legacy payment form."**
  They do not. The checkout product resolver and the amount-due helper that record calls theirs are
  deleted.
- **0019's third accepted risk** — that the Adyen redirect return is not exempted from the screens'
  redirect guards, surviving only because the mocked membership reports no subscription. Both
  checkouts now exempt it explicitly, on the redirect result in the address rather than on anything
  the mock says.
- **0019's "The success route and the submit-button label became inputs."** The label still is; the
  route is now a callback, and the island holds no route at all.
- **0018's two accepted risks** — a displayed amount from one catalogue and a charged amount from
  another, and a payment method created against a different provider account than the charge — are
  closed everywhere except the payment-method update dialog, which raises no charge of its own.

## Consequences

**Reactivation is charged through the payments service while the billing screen reads its
subscription from the legacy API.** Whether that upstream observes a subscription created through the
payments service decides whether the refreshed screen tells a reactivating member the truth. This is
an accepted risk and a question for the backend, not something this application can settle. Moving
that read onto the payments service is the exit condition, and it is the same read 0018 named as the
follow-up that retires the mocked membership on the checkout screens.

**The payments service's own reactivate endpoint is not adopted.** It resumes a cancelled-but-unexpired
subscription without taking a payment, which is a different act from buying again after expiry. Trying
it first would require the payments-service subscription read above. The glossary now separates the two
so the words do not get reused for each other.

**A catalogue publishing neither a non-trial four-week product nor a price in a member's currency
costs that member the reactivation offer, silently to them and loudly in the logs.** That is the
intended trade: the alternative was selling them a trial they are not eligible for, or taking the
whole billing screen down.

**A screen adopting the island next states a price row, a market, a submit label and what a
completed sale means there — and no flags.** Nothing about the two screens
added here reached into the island; the one thing that did — a route — left it. The report of a
redirect being resolved is the only new outward-facing signal, and it names a payment state rather
than a screen.

**Two seams are tested, both as high as the change allowed:** the pricing reader's public surface,
where the reactivation rule joins the other commercial rules as a pure function over
specification-shaped fixtures, and the pure predicate deciding whether an Adyen redirect is being
resumed. Nothing reaches into the island's components, asserts on markup or mocks a payment provider.
Everything else was proved by walking it.

**Still parked, from 0019:** the island's copied types remain independent of the generated payments
specification, its markup remains outside the redesign, the tracking stub remains a no-op, and the
placed-order report remains a placeholder that logs.
