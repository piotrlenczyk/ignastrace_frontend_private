# 0019 — The parked checkout island

**Status:** Accepted — August 2026, and **live since August 2026**. It landed as a staging step
ahead of the payments-service checkout integration that
[0018](0018-checkout-quotes-payments-and-charges-the-legacy-api.md) stopped short of; that
integration has now happened, and the phone-lookup checkout screen renders this island in place of
the legacy payment form. What each seam became is recorded under
[Where the seams went](#where-the-seams-went) below, which also corrects two claims this record made
that were never true.

## Context

Migrating checkout onto the payments micro-service means taking the payment, not just quoting it —
the Stripe and Adyen flows, the provider wrapper that switches between them, 3DS challenges, wallet
and Express Checkout, Adyen redirect completion, amount normalisation. That logic already exists,
proven, in the resumewise frontend. Rebuilding it from scratch here would duplicate a lot of subtle
payment-flow code and risk quietly diverging from the original.

The two repositories do not line up, though. Ignastrace has no Adyen dependency, an older Stripe
major, a differently-shaped payments data layer, **typed** next-intl messages (an unknown key fails
the type-check), and the data-layer ADRs the resumewise server actions do not obey. A naive copy
would neither compile nor respect the house rules. What the integration needs first is the proven
checkout code sitting here as a faithful, compiling starting point — not yet wired to anything — so
that wiring it is a matter of swapping seams rather than re-reading logic.

## Decision

**The resumewise checkout core lands as a self-contained island under `src/components/checkout/`.**
It mirrors resumewise's internal layout (`stripe/`, `adyen/`, the shared card/wallet shells and the
loading provider) plus a co-located `_shared/` area carrying its own copies of the small dependencies
it needs — utility helpers, pricing types, the payments-schema types, and the handful of UI
primitives. The checkout files themselves stay byte-faithful to the originals apart from repointed
import paths and the single `useTranslations` namespace argument (now under `__NEW__.checkout`). This
is what keeps a diff against resumewise meaningful and lets a reviewer trust the large copied surface
while scrutinising only the small hand-written one.

**Everything the island genuinely lacks is a co-located, typed stub, and the seams are obvious.**
Tracking and GTM are no-ops; routing is local path constants; `useSettings` is a fixed-flags module.
The two pieces of genuine infrastructure that already exist here — the `safe-action` client and its
`isHttpClientActionError` guard, and the toast — are reused rather than copied. Nothing else leaves
the island, no route renders it, and no production path reaches it.

The server actions the payment components call — start/sync Stripe, load-methods/
create-subscription/submit-details for Adyen — are **not** stubs and never were: they are real calls
onto the payments service through `paymentsApiServerClient`, on this repository's own `actionClient`.
An earlier draft of this record described them as placeholders throwing `TODO: payments integration`;
that was wrong on the day it was written. The ZIP update is the one payments call still standing in
for itself, inline in `StripeCardPayment` rather than as an action, because the endpoint accepts a
field nothing fills.

**The stubs keep resumewise's payment-action shape, not ADR-0011's.** They return typed data on
success because the copied components read it off `.data` (`clientSecret`, the Adyen payment result,
the ZIP validity). That is deliberately at odds with
[0011](0011-auth-failures-on-the-standard-action-error-channel.md)'s "return nothing on success" — it
mirrors the payment actions the future integration will drop in, and reconciling the shape belongs to
that task, not this one.

**The copied types stay independent of the generated payments specification.** The island carries its
own copy of the payments schema types (`_shared/types/paymentsApi.d.ts`) rather than importing
`src/network/payments-api/payments-api.d.ts`. Reconciling the two is a deliberate step the
integration takes, not an accidental coupling that already happened. The file keeps its `.d.ts`
extension so `skipLibCheck` skips the duplicate-operation identifiers openapi-typescript emitted, as
it did upstream.

**The island is excluded from the redesign ratchet, not added to it.** It carries resumewise's own
frozen legacy styling verbatim, which this theme does not define — so it is kept out of
`MIGRATED_PATHS`. Styling and structure are addressed when a later task rebuilds the screen onto the
new design, not linted into it now. An earlier draft of this record also described a
directory-scoped eslint override turning off `better-tailwindcss`, `consistent-type-definitions` and
`react-hooks/refs` for this directory; **no such override was ever added to `eslint.config.mjs`**,
and none has been needed — the island lints clean of errors on the repository-wide configuration,
warnings included in the ones the copied hooks already carry.

## Where the seams went

The integration wired the island to the phone-lookup checkout screen. The parts that changed:

- **A composition root and a payment-method selector were added** — `Checkout.tsx` and
  `SelectPaymentMethod.tsx`, both in the island's own PascalCase. The root renders the total, the
  selector, the provider wrapper and the recurring-charge consent, and supplies the loading context
  the four payment components read, with a small overlay over it.
- **The success route and the submit-button label became inputs.** `CheckoutProvider` no longer
  carries resumewise's upsell and cover-letter concepts and no longer knows this application's
  routes: the screen hands it the upsell-carrying success route or the plain one, and the label. The
  placeholder route module is deleted, so there is no second answer to where checkout goes.
- **The purchase-event branch is gone rather than completed.** It read a checkout cookie nothing in
  this repository writes, behind an action gated by an environment switch — code that could not
  execute. Removing it removed the provider's only use of the visitor's email address, and `libs/
checkout-cookie` with it: that module was added by this island's own commit to serve this one
  branch, and a reader and writer for a cookie nothing sets is the trap the removal is about.
  `actionSendPlacedOrderEvent` is left standing, unreferenced, as the placeholder the Klaviyo work
  resumes from. The purchase event returns with the tracking layer, which is also what retires
  `_shared/stubs/tracking.client`.
- **The artwork points at this repository's own payment images.** The card-brand row referenced a
  `/payments-border/` directory that does not exist here, so it was broken; it and the wallet logos
  now read `/images/payment-*.svg`, and the card tile uses this project's `credit-card` icon.
- **The consent paragraph stays on the legacy `pages.checkout` keys**, deliberately and with a
  comment saying so: it is a legal statement about a recurring charge, and duplicating it under
  `__NEW__` would give one obligation two sources of truth. Everything else the root says is new
  copy under `__NEW__.checkout`.
- **The settings stub had already closed**, ahead of this task, when
  [0020](0020-one-answer-to-what-is-switched-on.md) landed the real settings layer: the island reads
  `useSettings` from it, so the ZIP-code, upsell and Adyen-Google-Pay switches answer to the override
  cookies like every other switch.
- **The plan-to-product rule went into the pricing reader**, not the screen. The payments service
  derives the amount from the price identifier and accepts nothing that could express "skip the
  trial", so the funnel's plan selects a catalogue _product_; `getPlanProductName` states that, and
  it is tested over specification-shaped fixtures beside the rules 0018 put there.

## Consequences

The island is live on one screen. The phone-lookup checkout displays and charges one price row
through the payments service, so 0018's two accepted risks — a displayed amount from one catalogue
and a charged amount from another, and a payment method created against a different provider account
than the charge — are closed on that screen. Adyen is reachable in production for the first time.

**The reverse-lookup checkout and the reactivation dialog keep the legacy payment form**, and with it
0018's risks, until they migrate. `getCheckoutProduct` and `getAmountDue` are theirs and are
unchanged.

**Three risks are accepted knowingly**, in the order they are likely to bite:

1. The outright-subscription plan only charges the full amount where the catalogue publishes a
   non-trial four-week product. Where it does not, `getPricingProduct` falls back to the default
   product — the trial one — and the visitor is charged a trial amount. resumewise behaves
   identically, and this replaces a worse failure: the amount used to be chosen locally while the
   legacy API charged from its own catalogue regardless.
2. A catalogue publishing a provider account that is neither Stripe nor Adyen yields a checkout with
   an amount and tiles but no payment form and no error. `CheckoutWrapper` renders nothing, exactly
   as upstream; making it loud would mean restructuring copied code.
3. The Adyen redirect return is not exempted from the screen's redirect guards. It survives today
   because the mocked membership reports no subscription — a dependency on the mock, not on a
   contract, which breaks when those guards start reading the payments service's own
   current-subscription endpoint. That read is 0018's recorded follow-up and touches other screens
   too, so it was not folded in here.

**Still parked:** the copied types remain independent of the generated payments specification, the
markup remains outside the redesign, and `_shared/stubs/tracking.client` remains a no-op.
