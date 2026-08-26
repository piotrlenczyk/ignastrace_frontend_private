# Project context

## What this repository is

This is an **old, inherited codebase** — a duplicate of the mobitrace.io frontend (Next.js 14
App Router, TypeScript, next-intl, Tailwind v4, Radix + cva components). Everything you find
here predates the current effort and should be treated as legacy unless it lives in one of the
"new" locations listed below.

The programme of work has two parts:

1. **Rewrite the application onto the new design** (new Figma design system, new layouts,
   new components).
2. **Wire it up to the new API.**

**Both parts are in scope now.** The design work is the bulk of it, but the data layer described
below has landed and is the pattern new code follows.

**A third part has been finished: there is no legacy data layer.** The old backend, the client
factory, the browser hook over it, the server getter, the unspecified proxy under `/api/legacy` and
the second backend host in the environment are all gone. **There are two upstreams and only two** —
the new API and the payments service — so every backend call a screen makes goes through the data
layer described below, and nothing here invents member data any more: a wrong field on a screen is
always some upstream's real answer. The decision records from
`docs/adr/0022-retiring-the-legacy-layer-on-its-own-track.md`, where the track was opened, to
`docs/adr/0039-the-standalone-search-moves-and-its-unlock-joins-the-sequence.md`, where it closed,
are the history of how that happened; read one before contradicting it, not to learn the shape of
today's code.

What that leaves as standing rules:

- **Don't rewrite a screen's fetching unless you are redesigning the screen.** The retirement track
  was the exception to that rule, and it has closed.
- **An upsell is identified twice, in two constants that sit side by side** in
  `src/libs/upsell-products.ts` and are exhaustive over the product-key union: `UPSELL_PRODUCT_SLUGS`,
  the payments slug a key is priced and charged by, and `UPSELL_CREDIT_PRODUCTS`, the new API's
  credit-balance product a key names — or `null`, which is a fact about the upstream rather than an
  omission. Where no product resolves, the offer is skipped rather than priced from a fallback.
- **The order money moves in lives in one pure module**, `src/libs/upsell-unlock.ts`: spend a credit,
  buy one first only where a **fresh balance** says there is nothing to spend — never an error code
  (`docs/adr/0031-spend-versus-buy-is-settled-from-the-credit-balance.md`) — then confirm and spend
  again. The price on screen and the amount charged come off the same payments row, for every upsell
  without exception
  (`docs/adr/0030-the-upsell-charge-follows-the-price-and-the-credit-is-spent-on-the-new-api.md`,
  `docs/adr/0039-the-standalone-search-moves-and-its-unlock-joins-the-sequence.md`).
- **Ownership of an upsell is read from the new API** — its credit balances, or the entitlement on the
  current user — and **never** from the payments service's per-user answers, which are the shared
  technical account's. One stated exception: the order-success screen's `scan_pro` and
  `support_hotline`, which exist in no other upstream (`docs/adr/0032-the-order-success-extras-move-to-payments-and-the-cart-dissolves.md`). Don't extend it to another
  key. For the standalone sex-offender search ownership is not askable at all, and the compiler refuses
  it: a spendable credit is not an unlocked candidate.
- **Every payments write is raised as one shared technical account**, and pays the cost
  `docs/adr/0023-a-shared-technical-account-for-the-payments-upstream.md` records. The one exception is
  the public cancellation, whose endpoint declares no security and acts on the user named in its body.
- **The public cancellation is a server action, not a hook** — the payments proxy refuses the whole
  `internal` family to the browser — and it resolves the member's id from the address the form collects
  through the API's `POST /api/v1/auth/get-user-by-email`, which the API proxy likewise refuses to page
  scripts (`docs/adr/0035-the-public-cancellation-follows-onto-payments-through-a-server-action.md`). Read that record before moving another call into a refused path family.
- **The subscription gate is one rule asked one way.** `hasAccess`, computed once in
  `getSubscription()`, mapped onto the gate's three buckets; it reads no account, settles
  guest-versus-member from the session's `isLoggedIn` flag, and treats **only a 404** as "no
  subscription" — every other refusal, and a service that cannot be reached at all, moves nobody and
  logs (`docs/adr/0036-the-subscription-gate-reads-the-payments-service.md`). Read it before changing where a gate sends anybody, and before assuming a
  routing bug is one: when the shared technical account's own subscription expires, every member is
  routed as though theirs had.
- **The funnel's purchase events report what was actually bought** (`docs/adr/0037-the-funnel-s-purchase-events-report-what-was-bought.md`). The
  subscription's `purchase` is valued from the subscription record's product price and `upsell_purchase`
  from the run's own purchases, priced through the upsell resolver; no `upsell_purchase` is sent where a
  run comes to nothing. What a run bought lives in a **separate session cookie**,
  `src/libs/funnel-upsell-record.ts`, written by the funnel screens that charge and by no member-area
  surface — never a field on the checkout attempt, which a completed payment ends — and the decision
  itself is one pure module, `src/libs/funnel-purchase-event.ts`.
- **There is no member domain type.** The server-side account read returns the generated `UserResponse`
  with nothing merged onto it, and every screen reads the account's own `camelCase` field names
  (`docs/adr/0038-the-mocked-membership-is-deleted.md`, which supersedes 0013). Don't reintroduce a
  member type, a composer, or an adapter over the account response.
- **A report's gated sections are gated on the new API's section state**, not on booleans, and the
  unlock that changes a section is the same payments charge and new-API spend as every other upsell.
  `docs/glossary.md` defines the states.
- **The notification centre shows the `title` and `body` the backend composes**, so notification copy is
  English everywhere but `en` and `es`, and the header badge is the member's real unread count
  (`docs/adr/0034-the-notification-centre-moves-whole-and-loses-eleven-languages.md`).

The **Activity Hub** shows a third kind of row: the new API's feed
models purchased sex-offender search reports, so they are on the list — in one recency order with
location requests and reverse-lookup reports, opening the standalone record's screen, and **titled by
what they are rather than by whom they are about**, because the feed publishes no name
(`docs/adr/0040-the-third-kind-arrives-and-the-rows-come-back-untitled.md`, which corrects the
consequence of 0026 that said those rows stayed gone and closes the last exit condition ADR 0014 named).
The list's row kind is `SEX_OFFENDER_SEARCH_REPORT` — the feed's own name, and the standalone record,
never the sex-offender **section** of a reverse-lookup report; the glossary distinguishes the two. The
mapping in `src/app/[locale]/memberarea/status/_page/activity-list.ts` stays a pure function that names
every source kind explicitly, so a fourth kind upstream is a compile error rather than a row drawn as
something else — which is exactly how these rows came to be shown as unanswered text messages. The
screen otherwise keeps its legacy palette, components and translation namespace.

## Design implementation rules

### Tokens: `src/styles/new` is the only palette for new work

`src/styles/new/` is generated from the Figma file (`Ignastrace.io`, light mode) by
`npm run generate:tokens-css` out of `figma-variables.json`. Never hand-edit those files.

- `primitives.css` — raw scale (`--gray-500`, `--primary-color-600`, …)
- `semantics.css` — colour **intent** tokens; these are what markup uses: `bg-bg-brand-solid`,
  `text-text-primary`, `border-border-secondary`, …
- `typo.css` — named text styles: `text-display-xl-medium`, `text-lg-semibold`, `text-sm-regular`, …
  A text style sets size, line height, weight and tracking; **the family is separate**, so pair it
  with `font-display` or `font-body`.

When implementing a Figma design:

- Every colour comes from a **semantic** token. Reach for a primitive only when the design file
  genuinely has no semantic for it, and never write a raw hex or an arbitrary value.
- Every piece of text gets a **named text style** class, not an ad-hoc `text-[15px] leading-6`
  combination, and not the legacy sizes.
- The **legacy palette and type scale in `src/styles/_theme-legacy.css` are frozen.** Nothing is
  added to them; they are deleted whole once the last page is redesigned. See
  `docs/adr/0005-two-colour-systems-during-the-redesign.md` — both vocabularies compile side by
  side, they share no names, and there is no switch between them.
- When a route or component directory has been fully rebuilt, add it to `MIGRATED_PATHS` in
  `eslint.config.mjs`. That turns on the ratchet that reports any legacy colour or size class in
  those files.

If a token you need is missing from the export, say so rather than inventing one — the fix is a
Figma change plus a re-run of the token generator (the `figma-design-tokens` skill).

### Components: rebuild with cva, cover every Figma variant

Components in `src/components/ui` are the **old** design system. For design work:

- Either redesign the existing component or write a new one — whichever is cleaner. Do not patch
  new-design styling onto an old component's variant list.
- Model the component with **`class-variance-authority`**: one `cva` definition, variants named
  after the Figma design-system properties, `defaultVariants` matching the Figma default, and
  `VariantProps<typeof …>` in the exported props type. `src/components/ui/button.tsx` shows the
  established shape (cva + `React.forwardRef` + `cn`).
- Implement **all variants, sizes and states the Figma component set defines** — including
  hover, focus-visible, active, disabled, and any icon/loading permutations — not just the ones
  the current screen happens to use.
- Compose classes through `cn` from `@/libs/utils` so token-aware merging works.
- Keep behaviour on Radix primitives where the old component already used them.

## Data layer

`docs/adr/0009-one-proxy-for-every-browser-call.md` records why this shape, and is the record to
read before contradicting any of it.

**There are two upstreams.** The new API is one. The payments service — products, prices,
subscriptions, transactions, payment providers — is a second, with its own generated specification,
its own two clients and its own proxy;
`docs/adr/0016-a-second-upstream-with-its-own-client-proxy-and-specification.md` records why it is
separate rather than folded in. Server-side, the API is read through
`src/network/api/apiServerClient.ts` and payments through
`src/network/payments-api/payments-api-server-client.ts`, and neither client can serve the other's
paths. A browser call to payments goes through the payments query hooks (`$paymentsApi` in
`src/network/payments-api/payments-api-browser-client.ts`) onto the payments proxy at
`/payments-api-proxy`, as an API call goes through `$api` onto the API's at `/api-proxy`. The
payments door attaches a token as the **cookie** that service authenticates with — it offers a member
no bearer — and refuses the back-office path families outright. A payments refusal arrives in the same
flattened envelope as an API one, discriminated by `source: 'payments-api'`. Regenerate its
specification with `npm run generate:payments-api`. The payments host is temporarily a resumewise
development instance, the only one that answers today; when an Ignastrace one exists the change is
that environment variable's value and a regeneration against the new host, not code.

**The token that door presents is not the member's.** That upstream only recognises tokens it issued,
so the session carries a **second pair** — the payments credential, belonging to one shared technical
account, seeded from configuration and renewed in a second branch of the middleware's session step.
The API pair still says who the member is; the payments credential says nothing about anybody. It
lives in `src/server/session/payments-credential.ts` and nowhere else, and it is temporary by
construction: `docs/adr/0023-a-shared-technical-account-for-the-payments-upstream.md` records the
trade and the condition for deleting it. Don't build on it, don't read it outside that module and the
payments client, and don't gate it on a feature flag — configuration presence is the switch.

The rules:

- **The browser never calls a backend directly, and holds no token.** Every browser call goes
  through a catch-all proxy in this application, which attaches the session's token server-side, in
  the form the upstream it fronts authenticates with — a bearer for the API, a cookie for payments.
  The session is one sealed, http-only cookie; client components read identity — never a token —
  from the session provider in the root layout.
- **Server components and server actions read through the server-side client**
  (`src/network/api/apiServerClient.ts`), typed from the generated specification in
  `src/network/api/api.d.ts`.
- **Client components read and write through the query hooks**
  (`src/network/api/api-browser-client.ts`, `openapi-react-query` over the proxy). A call is typed
  end to end — path, body, response and error — because the proxy mounts the upstream path
  verbatim. Use the generated path literal; don't add a prefix.
- **A write is a server action when it must set a cookie, redirect, or invalidate the Next cache**
  — sign-in, sign-out, registration and anything of that shape. Everything else is a TanStack Query
  mutation through the hooks. After a mutation, invalidate deliberately at the call site: query
  keys for client-held data, `router.refresh()` only where the change shows in server-rendered
  output.
- **Server actions are built on `next-safe-action`**, on the one action client in
  `src/server/lib/safe-action.ts`. It turns a parsed API error into a structured action error, so a
  failure arrives at the form as data. `'use server'` modules may only export async functions, so
  input schemas live in a sibling module.
- **A form calls a server action through `useAction`** from `next-safe-action/hooks` — not through a
  query-library mutation wrapping it — and reads a refusal through `isHttpClientActionError`.
  An action returns nothing on success and answers a refusal with `serverError`; don't reintroduce a
  success/error outcome object. Branch on the API's `errorCode`, never on the HTTP status, and keep a
  generic fallback for a failure that carries no envelope
  (`docs/adr/0011-auth-failures-on-the-standard-action-error-channel.md`).
- **Read a response through `unwrapApiResponse`** (`src/network/http-response-handler.ts`), not by
  poking at the client's result. Parsers and the parser manager sit behind it; leave them alone —
  the interface is deliberately the reference repository's, not the smallest thing that works.
- **A new endpoint needs no route handler.** Regenerate — `scripts/api-build.sh` emits both the
  types and the proxy's path allow-list — and add a hook.
- Don't add a global 401 handler, a prefetch, or a hydration boundary without a ticket; all three
  were deliberately left out.

## Settings — what is switched on

`docs/adr/0020-one-answer-to-what-is-switched-on.md` records the shape;
`docs/glossary.md` defines the words.

One object answers it, settled once per request in `src/settings`. Three sources feed it — the
backend's `/features`, this application's environment, and the `overwrite_feature_*` override
cookies — and a reader is never told which.

- **A server component or action reads `getServerSettings()`; a client component reads
  `useSettings()`.** Neither reads `process.env` for a switch, and no client component fetches
  flags. A switch therefore needs no `NEXT_PUBLIC_` prefix: new ones are `FEATURE_*`, read on the
  server and delivered as a computed field.
- **Add a flag by adding a named field**, in the intent's vocabulary (`reverseLookupEnabled`),
  never the source's (`reverseLookup`), with a declared default in the defaults module.
  A switch defaults off: a source that cannot be read leaves the page rendering with the feature
  hidden, and the incident logged. `reverseLookupEnabled` and `smsConsentEnabled` are the two
  documented exceptions — live features the API does not publish a flag for yet, so they default on
  until it does.
- Both `1` and `true` count as on. An override cookie is tri-state — on, off, or absent — and only
  absent defers to the source. The QA widget that sets these cookies is environment-gated and
  cookie-proof by design.
- **The backend flags come from the new API's `/features`, through `apiServerClient`** — no bare
  request. Its registry is `camelCase` and deploy-time only; today it declares
  `sexOffenderReport` alone, and the keys for `reverseLookup` and `smsConsent` are mapped ahead of
  it. Adding a flag on that side is a `FEATURE_FLAG_*` variable plus a line in the backend's
  `features.config.ts`, and only the exact string `true` turns it on there.

## Translations

- All copy coming from the new designs goes under the **`__NEW__`** top-level key in
  `src/locales/en.json`, nested by screen/component underneath it.
- **English only.** Do not add, translate, or touch `src/locales/*.json` for any other language,
  and do not run the Lokalise scripts (`docs/translations.md` — translations are the translation
  team's responsibility).
- Do not reuse or re-key existing legacy strings; new designs get new keys, even when the wording
  is identical.
- Read them with next-intl as usual, e.g. `useTranslations('__NEW__.checkout')`.

## Storybook

`npm run storybook` opens the workbench for the new design at `localhost:6006`. It
catalogues **v2 only** — the generated colour tokens and text styles under
`Foundations`, and the rebuilt components and sections. Legacy components get no story;
they are frozen and deleted with the old theme (`docs/adr/0007-*.md`).

- Stories sit next to the component, as `<component>.stories.tsx`, and are typed with
  `Meta`/`StoryObj` from `@storybook/nextjs-vite`.
- Cover the Figma variants the component defines, not just the ones a screen uses.
- The foundation stories read `src/styles/new` as text — regenerating tokens updates them,
  so never hand-list a colour or a text style there.
- A class name assembled at runtime compiles to nothing (Tailwind scans source text), so
  render a token by reading its custom property, not by building a class string.
- Configuration lives in `.storybook/`: the app's providers and the web fonts are supplied
  there, and `@/actions/funnel-phone-number` is aliased to a stub because a `'use server'`
  module cannot load in a browser.

## Working conventions

- `npm run check-types`, `npm run lint` and `npm run format:check` are the checks to run.
  Don't run `dev` or `build`.
- `npm run verify` chains all of those plus the tests and a production build. It is the one
  command that answers "is this in a good state", and the one line that goes into CI when a
  gate is back in scope.
- The lint bar is **zero errors**; warnings are permitted and there are some. Don't add a
  disable directive to clear one — if a rule is wrong for this codebase, change its severity
  in `eslint.config.mjs` and say why in an ADR. See
  `docs/adr/0006-lint-and-format-without-antfu.md`, which lists the rules already demoted.
- Prettier owns formatting, at 120 columns to match the Tailwind class wrapping width. Both
  generators format their own output, so regenerating tokens or icons never produces a
  whitespace-only diff.
- **CSS has no linter.** Stylelint went with the old lint stack; Prettier formats stylesheets
  but checks nothing about them. Hand-written CSS is on you.
- `AGENTS.md` carries a generated index of the Next documentation for the installed major.
  This file stays the source of project rules; regenerate that one after a Next upgrade with
  `npx @next/codemod agents-md --output AGENTS.md`.
- **`middleware` deliberately stays on the deprecated convention.** Next 16 renames it to
  `proxy`, which only supports the Node.js runtime — and changing the runtime of the composed
  auth, i18n, case-normalisation and tracking chain is a behavioural change, not a rename.
  This is a known deferred item, not an oversight. Don't "fix" it without planning that.
- No `any` in TypeScript.
- Architectural decisions live in `docs/adr/` — read the relevant record before contradicting one.
