# 0037 — The funnel's purchase events report what was actually bought

**Status:** Accepted — August 2026. Empties a third fact out of the mocked membership of
[0013](0013-a-mocked-membership-until-the-api-publishes-one.md): the amounts and the currency the
three funnel confirmation screens reported. Reads the subscription record
[0036](0036-the-subscription-gate-reads-the-payments-service.md) put in front of those screens, and
prices upsells through the resolver [0029](0029-the-upsell-price-moves-to-payments-and-the-charge-stays-behind.md)
added and [0030](0030-the-upsell-charge-follows-the-price-and-the-credit-is-spent-on-the-new-api.md)
made authoritative. Inherits [0023](0023-a-shared-technical-account-for-the-payments-upstream.md)'s
cost, unchanged and unpaid.

## Context

**The numbers the business reads as revenue were invented.** `/success`, `/thank-you` and
`/lookup-thank-you` each push one purchase event to the data layer, and every figure in it came out
of the **mocked membership**: one fabricated amount for every visitor, and the currency `usd`
whatever market they bought in.

**The worst of it was the visitor who declined.** The funnel's upsell steps are optional. Somebody
who bought a subscription and refused every step still reached a thank-you screen, and was still
reported as having spent the full invented upsell amount. `upsell_purchase` therefore fired once per
visitor who reached a thank-you screen, not once per sale — which is a conversion rate computed from
a constant.

**Nothing in the application knew what a visitor bought during a funnel run.** The purchase happens
in the browser, the confirmation screen renders on the server, and no record passed between them.
The **checkout attempt** could not be that record: the checkout island deletes it on payment
success, and the upsell steps run after that point.

**The honest inputs had already arrived, screen by screen.** The subscription record carries the
amount in cents and the currency the member pays in, and 0036 made it a precondition of every one of
these screens — a 404 is the no-subscription bucket and redirects, so by the time an event renders
the record is guaranteed present. The payments upsell catalogue carries a price per row, reachable
through the resolver five screens already use.

## Decision

**One pure module decides the whole event.** `libs/funnel-purchase-event.ts` takes the raw cookie
value, the subscription record's product price and the upsell catalogue, and answers with an event
name, a value and a currency — or with nothing. No network, no cookies and no React inside it, which
is the shape `upsell-unlock` and `resolveUpsellProduct` already established, and it is where every
case is covered by a test. One getter beside it — `getFunnelPurchaseEvent` — does the fetching for
all three screens, so each of them asks for its event in one line and the three reads are described
once.

**The subscription's amount and currency come from the subscription record's product price.** The
same `product.price` the billing screen renders as "the subscription price", in cents, in the row's
own currency. That currency becomes the currency of **both** events: it is the one currency in the
run a member demonstrably paid in, and pricing the two events differently would make the pair
unaddable.

**A new cookie records what a funnel run bought**, modelled closely on the checkout attempt — a
session cookie holding readable JSON, written from the browser through the same helper, parsed
behind a schema, and a malformed value indistinguishable from no cookie at all.

**It is deliberately a separate cookie, not a field on the checkout attempt.** A completed payment
ends the checkout attempt, and the upsell steps run afterwards; a field would mean resurrecting a
record that had just been ended on purpose, and would leave the checkout screen reading an attempt
that is not one. This record means something different: what this run bought _on top of_ the
subscription.

**Only funnel screens write it**, and only after a purchase actually succeeded — the three
reverse-lookup upsell steps, and the order-success screen's two extras, which are the classic
funnel's upsell step by another name and are followed by a thank-you screen that reports them. The
member area's unlock surfaces buy the same products through the same hook and must not write it:
their purchases have nothing to do with a funnel confirmation screen.

**The keys are the application's own upsell vocabulary**, not payments catalogue slugs, for the
reason the checkout attempt records a funnel plan rather than a product name: renaming a catalogue
row must not invalidate cookies already sitting in browsers. Membership is checked against
`UPSELL_PRODUCT_SLUGS`, which is exhaustive over the key union, so the vocabulary the cookie
validates against cannot drift from the one the rest of the application speaks.

**No `upsell_purchase` event is sent where the run comes to nothing.** A visitor who declined every
step, a record that does not parse, a key the catalogue prices at nothing, and a catalogue that could
not be read are one answer: no event. An upsell with no resolvable price is skipped and never priced
from a fallback, which is 0029's rule applied to reporting rather than to selling. The
subscription's own `purchase` event is unchanged and keeps firing.

**A record that does not parse is refused whole, not repaired.** One unrecognised entry means the
value did not come from this application, and half-reading it would report a purchase from a payload
nothing here wrote. It costs that visitor their analytics event and nothing else — never the screen.

**The record is discarded in the browser, on the screen that reported it.** A server component
cannot delete a cookie during a render, so it is an effect, mounted after the purchase event on the
two thank-you screens. It runs whether or not an event was pushed: a record that priced at nothing
must still not outlive the screen that read it, or the next run in the same session would add its
own purchases to it and report both. The order-success screen does not mount it — its extras are
bought _after_ its event fires.

**Klaviyo's order-confirmed report stays unconditional.** It reports the order, not the upsell.

## Alternatives rejected

**A field on the checkout attempt.** Rejected above: it resurrects a record deliberately ended at
payment success, and gives the checkout screen an attempt that is not one.

**Reading the billing transactions endpoint.** It knows the amounts actually charged and would be the
honest source. It is a second payments call on a screen that already makes two, on a path where the
answers are the shared technical account's anyway (0023), and the catalogue price is the same number
in every case the placeholder catalogue can produce. Recorded as the thing to revisit when 0023 is
paid off.

**Passing the purchases through the URL instead of a cookie.** Query parameters on a confirmation
screen are visible, shareable and trivially forged, and the value they carry is reported as revenue.
A session cookie is forgeable too, which is why the parse is guarded — but it is not forwarded by
accident.

**Sending `upsell_purchase` with a value of zero rather than not sending it.** A sale of nothing is
still counted as a sale by whatever reads the stream. The absent event is the honest answer, and it
is the one the conversion rate needs.

**Branching the subscription amount on `onTrial`.** The trial amount is closer to what was charged at
that instant, and the recurring amount is what the billing screen and this application already call
the subscription's price. One reading of "the price" across the application beats two, and the
transactions endpoint is the real fix for "what was charged".

## Consequences

- **`upsell_purchase` volume will fall, and marketing should be told before this ships.** The event
  currently fires for every visitor who reaches a thank-you screen; afterwards it fires only for
  those who bought something. The drop is the defect being removed, not a regression.
- **The two amounts are honest about their source and still wrong in absolute terms, because of 0023.** The subscription price reported is the shared technical account's subscription price. The
  upsell price is the one placeholder product the development payments instance publishes, so a
  visitor who buys two different upsells is reported as having bought the same row twice. Both become
  correct when the payments upstream is an Ignastrace one publishing real products; **neither becomes
  correct through a change in this application.** A wrong-looking amount is traced here first.
- **Each confirmation screen makes one more payments call**, the subscription read the gate above it
  already made and does not hand on. 0036 declined to memoise that read per request and this record
  does not revisit it; it is the same cost, on three screens.
- **A payments outage costs the event rather than the screen.** No subscription record means no
  amount to report, so nothing is pushed and the confirmation screen renders exactly as it does now.
- **Four fields of the mocked membership now have no reader at all** — `trial_price`, `total_price`,
  `upsellings_price` and `currency`. They are left in place: deleting the mock is its own task, and a
  field removed before its last reader only moves the invention somewhere less visible.
- **The classic funnel's `upsell_purchase` now depends on the order-success screen writing the
  record.** That screen is the only thing between checkout and `/thank-you` that sells anything, so
  if an upsell step is ever added to that funnel it must write the record too. The rule is "a funnel
  screen that charges, writes"; the member area is the boundary.
- **Verification was the static checks and the test suite**, and the decision itself is covered case
  by case in `libs/funnel-purchase-event.test.ts` — including every value a hand-edited cookie can
  carry. No signed-in funnel walk was possible from this environment.
