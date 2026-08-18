# 0019 — The parked checkout island

**Status:** Accepted — August 2026. A staging step ahead of the payments-service checkout
integration that [0018](0018-checkout-quotes-payments-and-charges-the-legacy-api.md) stopped short of.

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
Every call into a payments backend — start/sync Stripe, load-methods/create-subscription/
submit-details for Adyen, update ZIP, the placed-order event — is a stub server action built on this
repository's own `next-safe-action` `actionClient`, throwing `TODO: payments integration`. Tracking
and GTM are no-ops; routing is local path constants; `useSettings` is a fixed-flags module. The two
pieces of genuine infrastructure that already exist here — the `safe-action` client and its
`isHttpClientActionError` guard, and the toast — are reused rather than copied. Nothing else leaves
the island, no route renders it, and no production path reaches it.

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
`MIGRATED_PATHS`, and a directory-scoped eslint override turns off the `better-tailwindcss` rules for
it (`no-unknown-classes` would flag every class; the order/wrapping fixers would rewrite copies meant
to diff cleanly). The same override turns off `consistent-type-definitions` for the one generated file
it carries, and demotes `react-hooks/refs` to a warning — the React Compiler analyses are advice
rather than a gate on this codebase (see the block in `eslint.config.mjs` demoting `purity` and its
siblings), and a parked copy is not restructured to satisfy one. Styling and structure are addressed
when a later task rebuilds the screen onto the new design, not linted into it now.

## Consequences

The island compiles green (`check-types`, `lint`, `format:check`) and ships no user-facing behaviour.
The integration task swaps the stubs for real payments-api calls, reconciles the copied types against
the generated specification, and redesigns the markup onto the new tokens — each a change to one
clearly-marked seam rather than a rebuild. Until then the code is present, inert, and honest about
what it is.
