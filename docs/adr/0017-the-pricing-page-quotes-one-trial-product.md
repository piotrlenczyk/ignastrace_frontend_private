# 0017 — The pricing page quotes one trial product, in a currency this application picks

**Status:** Accepted — August 2026. Applies
[0016](0016-a-second-upstream-with-its-own-client-proxy-and-specification.md), which wired the
payments service as a second upstream, to the first screen that reads its catalogue.

## Context

The public pricing page shows two numbers: what a visitor pays to start the trial, and what they are
billed every four weeks afterwards. Until now both came from the legacy API's aggregate product
endpoint, through the frozen legacy server client, in a hand-shaped payload whose field names exist
nowhere in the new world.

Nothing kept that aggregate in step with the payments catalogue, which is what actually charges the
card. The one screen whose entire job is quoting a price was the screen furthest from the source of
truth, and a plan configured in payments was invisible on it.

Three things about the payments catalogue make the move non-obvious.

**Two prices, one product.** A visitor is offered a trial and a subscription, which reads like two
things to sell. The catalogue does not model it that way: the four-week trial plan is a single
product, and one row of its price list states both the trial charge and the amount billed after the
trial. The reference implementation against this same service reaches the same two numbers by
cloning the trial product and zeroing its trial length — an indirection that produces two objects
where the data has one.

**The endpoint takes no currency.** The legacy aggregate was asked for a currency in the query
string. The payments endpoint has no such parameter: it answers with every currency it sells a
product in, and tells the caller where the caller is by a header. Something has to choose.

**Rows are per currency and per payment provider.** A product can carry several rows in one
currency, differing only in which provider would take the payment. Reading "the row for this
currency" is therefore ambiguous, and the ambiguity is invisible in a catalogue that happens to have
one provider configured per market today.

## Decision

**The pricing page reads one product and takes both numbers off one price row.** The product is the
one whose metadata names the four-week trial plan; where several match, the catalogue's own priority
ordering decides, lowest first. The trial card shows that row's trial amount and the subscription
card shows its regular amount. There is no second product, synthesised or otherwise. The
upsell-inclusive final trial amount is not used, matching the reference implementation, and the trial
length quoted in the copy comes from the same row as the numbers.

**This application chooses the currency, from the market it has already resolved.** The country the
page resolves — the development override cookie included — maps to a currency through the existing
country-to-currency helper, and that currency selects a price row, with US dollars as the fallback
when the catalogue does not publish the market's currency. Where several rows share a currency, the
last one wins, reproducing the reference implementation's own fold so that two applications pointed
at one catalogue quote one number.

**The read states the market rather than inheriting it.** The payments client fills in the caller
country header from the edge when a call site does not, and it is caller-wins. This read states it,
from the same country resolution that picked the currency. In production the two agree anyway; in
development the override then decides the market and the currency together, instead of pricing one
market in another's currency.

**Nothing is cached.** No fetch tags, no revalidation. The page is dynamic already because it reads
request headers, the response varies by a header the framework's cache does not key on, and a price
change is meant to be visible on the next page load rather than when a cache expires. This is a
deliberate departure from the reference implementation, which tags the read.

**Failure is loud.** A catalogue with no four-week trial product, or one priced in neither the
market's currency nor US dollars, throws and names the condition; a refusal from the payments service
already throws inside the shared response unwrapping. A broken catalogue is reported, not rendered as
an empty card.

**The read lives in a domain reader module beside the subscription reader**, with a single exported
entry point taking no arguments — the plan name is a constant inside it. Product, price-row and
currency selection stay private, so the rules are tested at one seam and the module can be
rearranged without rewriting a test.

## Consequences

The number on the pricing page is the number the payments service will charge, and a commercial
change to the catalogue changes the site.

The plan the page quotes is a string in the catalogue's metadata. The specification generator types
every metadata bag as an empty record, so reading that key takes a cast; it is done once, behind a
type guard, in the reader.

Checkout has an obvious module to reuse when its turn comes, and the first caller needing a different
plan is what will turn the constant into a parameter.

**Only this screen moves.** Checkout, the reverse-lookup screens and the billing settings screen keep
reading the legacy aggregate, and the legacy product type stays with them. Each moves when it is
redesigned; the legacy layer shrinks by one call site here rather than growing.

The shared price formatter's two special cases — the Romanian "lei" rendering and the Singapore
symbol — compared a lower-case currency code, which the legacy aggregate publishes and the payments
service does not. They now compare case-insensitively, so both vocabularies keep matching for as long
as both are in use.
