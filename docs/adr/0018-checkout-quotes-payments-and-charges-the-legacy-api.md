# 0018 — Checkout quotes the payments catalogue and charges the legacy API

**Status:** Accepted — August 2026. Extends
[0017](0017-the-pricing-page-quotes-one-trial-product.md) from the screen that quotes a price to the
three that take one, and stops short of the endpoints that would take the payment.

## Context

The pricing page moved onto the payments catalogue. Checkout — one click later, and the screen where
a visitor is actually charged — did not. It read the legacy API's aggregate product endpoint, in the
hand-shaped payload of four numbers that record described. Nothing kept the two catalogues in step,
so the price a visitor accepted on the pricing page and the price checkout showed could differ, and a
plan configured in the payments catalogue was invisible on the one screen where money changes hands.

Three screens read that aggregate, not one: the phone-lookup checkout, the reverse-lookup checkout,
and the reactivation dialog in billing settings. All three feed one shared payment form, and one of
them fetched the aggregate again from the browser every time the visitor changed currency. That
currency selector offered every currency the application knows rather than the ones the catalogue
publishes, so a visitor could select a currency no price existed in and be quoted in US dollars while
the selector still read their choice.

Checkout also initialised the Stripe SDK from a build-time environment variable, while the payments
catalogue publishes the provider account — and its public key — alongside each price. The screen had
no way to follow the catalogue onto a different provider account, and no way to discover it was
talking to the wrong one.

The obvious move — read the catalogue and take the payment through it too — is not available yet. The
payments service's subscription endpoints are a separate integration with their own failure modes,
and the legacy subscription flow works today.

## Decision

**The read moves to the payments catalogue; the charge stays on the legacy API.** The product, the
price, the currency list and the Stripe public key all come from the payments service. Creating the
subscription, confirming the card payment, reconciling it afterwards and updating a payment method
all stay on the legacy API, with the same fields in the same order, from the same shared payment
form. This is a data-layer change on three legacy screens; their redesign is separate work.

**The read grows inside the pricing reader rather than beside it.** The domain reader module the
pricing page introduced already held the payments-to-view mapping, the currency fold and the
plan-selection helpers. The reader layer at the server boundary gains two entry points: a general
catalogue read for the two checkouts, and a member catalogue read for reactivation. Both mirror the
integration this follows field for field, names included, so a number that disagrees points at a
configuration difference rather than at our code. The pricing page's own entry point is untouched.
No adapter translating payments back into the legacy four-number payload exists — that would be a
shim pointing the wrong way down the migration.

**The two new reads state the market.** Both take the country this application already resolved, the
development override cookie included, and send it as the caller-country header the payments client
otherwise fills in from the edge. In development the override then decides the market the service
answers for and the currency this application picks together, which is what makes testing another
market show one coherent price.

**One product, two amounts, and the funnel's plan chooses between them.** The catalogue publishes a
single four-week trial product whose price row states both the trial charge and the amount billed
afterwards. The plan the funnel stored — trial or outright subscription — selects which of the two is
due. It does not select a different product. The upsell-inclusive final trial amount stays unused, as
0017 decided, so checkout and pricing quote the same number, and the trial length driving the copy
comes off the same row as the amount.

**The catalogue bounds the currency, and switching it costs nothing.** The screen's initial currency
is the market's when the catalogue publishes a price in it and US dollars otherwise, decided during
the server render. The selector offers exactly the published currencies, so the label and the amount
cannot disagree, and changing currency selects among prices already in hand rather than making
another request. The formatted amount takes its currency off the price row rather than off the
selection, which closes the same gap from the other side.

**Reactivation reads the member catalogue, and falls back.** Someone who has subscribed before is not
offered a trial they are no longer eligible for, so the dialog reads the catalogue the payments
service answers a signed-in member with. That answer is one already-resolved price per product; it is
normalised into the same currency-keyed shape the guest catalogue produces, so both reads resolve to
one view type. When the service offers nothing member-specific, the guest catalogue stands in. The
read is resolved on the server and handed to the dialog, so the price is known before the dialog
opens, and it is resolved only for the subscription state that offers reactivation, so a member
reading their billing history does not depend on a price they are not being offered. No cookie is
assembled by hand: the payments server-side client already attaches the session's token as the cookie
that service authenticates with.

**A returning member keeps their own currency where the catalogue still sells in it**, then US
dollars, then whatever the service resolved. The last step exists because the member catalogue may
publish a single currency that is neither — quoting the price the service chose beats quoting
nothing.

**Failure is loud.** The screens no longer catch a failed product read and redirect to the home page.
An unreachable payments service, a catalogue with no four-week product, and a product priced in
neither the selected currency nor US dollars all reach the error boundary. This is a deliberate
behavioural change: a payment form with no price on it is worse than an error page.

**The new reads keep the pricing read's shape, which means they do not go through the shared response
unwrapping.** All three behave identically, deliberately. The cost is that a refusal is not
distinguished from an empty answer: on the guest read it becomes a catalogue with no product, so the
screen still fails — with the wrong reason named, its envelope discarded. On the member read it falls
through to the guest catalogue. That is survivable only because reactivation is quoted the full
four-week amount whichever catalogue answered, never a trial the member is ineligible for; it would
not be survivable if that read ever chose between a trial and a non-trial price. Routing these reads
through the unwrapping is the obvious follow-up.

**Stripe is initialised from the catalogue's provider account.** A second entry point beside the
environment-variable one takes the price's normalised public key and caches the loaded SDK per
language _and_ key — caching by language alone would hand back an instance built on whichever key
loaded first, and the language cache exists only to keep the 3-D Secure challenge in the site's
language. The environment-variable entry point and the variables behind it stay exactly as they are
for the upsell purchase form, which has no payments price to read a key from and dies with that
screen.

**The shared payment form takes the payments product, and the wallet takes an amount.** The form, the
Stripe form and the wallet component stop carrying the legacy payload. The wallet component used to
work out the amount by inspecting the shape of the product it was handed; it is now told the amount,
which also removes an ambiguity the payments type would have introduced. The legacy product type
keeps serving the reverse-lookup summary and the report screens that still read it, and dies with
them; the browser-side legacy product fetch is deleted, both its call sites having gone.

## Consequences

**The displayed amount and the charged amount come from two catalogues.** The legacy subscription
endpoint takes no price identifier — it derives the amount from its own catalogue — so checkout
displays a payments amount and charges a legacy one. This is an accepted risk. No code compares the
two and none blocks a payment on a mismatch; keeping the catalogues in step is an operational
concern until the payment itself moves.

**The payment method is created against the payments catalogue's Stripe account while the charge is
raised by the legacy API against its own.** If those are different accounts, payment fails — loudly,
on the first attempt, in a development environment rather than silently in production.

**The exit condition is the payments service's own endpoints.** Taking the payment through its
subscription endpoints removes the first risk entirely, because the price identifier travels with the
request. Reading its current-subscription endpoint completes the redirect these screens still make
from the mocked membership: a member holding a subscription in any state belongs on billing, and the
absence of one is that endpoint answering not-found. A note on the checkout read records this so it
is a known next step rather than a rediscovery.

**Nothing is cached**, for the reasons 0017 gave: these screens are dynamic already, the response
varies by a header the framework's cache does not key on, and a commercial change is meant to be
visible on the next load.

**The published currency list is now the currencies of a product this application quotes**, taken
after the products are filtered by plan name rather than from whichever the catalogue answered first.
With a single-product catalogue the two lists are identical; they part company as soon as the
catalogue carries a product under a plan name this application does not know.

**The country-to-currency helper answered US dollars for every market except Bulgaria**, because it
compares an upper-cased code against a table keyed in lower case. Nothing depended on the answer being
a real market currency until this change, so the bug was invisible; the currency rules here are built
on it, so it is fixed and pinned by tests. The two cases now meet in one place rather than being
reconciled by hand at each call site.

**The rules are tested at one seam** — the reader module's public surface, as pure functions over
specification-shaped fixtures. The plan-to-amount rule, both currency rules, the product-and-price
resolution and the member normalisation live there rather than in the screens, so the reads at the
server boundary stay thin enough to need no test of their own and the screens only pass props.
