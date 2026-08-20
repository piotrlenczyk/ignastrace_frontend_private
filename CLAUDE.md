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

**A third part has been added: retiring the legacy data layer, on a track of its own.** A legacy
call is now rewritten because it is a legacy call, not because the screen around it is being
redesigned — so the earlier rule that legacy plumbing dies with the screen it serves no longer
holds. Work on that track only through its tasks: one endpoint per task, the legacy wrapper gone
when the task ends, no adapters, and the screen on the new response shape.
`docs/adr/0022-retiring-the-legacy-layer-on-its-own-track.md` records the trade — including what
is deliberately out of scope and what is blocked on the upstream. Outside that track, still don't
rewrite a screen's fetching unless you are redesigning the screen.

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
- **New code must not import the legacy clients** — `src/libs/api-client.ts`, `src/hooks/use-api.ts`
  and `src/libs/server/api.ts`. They are frozen, and they are now being emptied call by call on the
  retirement track rather than left to die with their screens
  (`docs/adr/0022-retiring-the-legacy-layer-on-its-own-track.md`). The browser-side one goes through
  its own proxy under `/api/legacy`; that whole layer is temporary, and the last task on that track
  deletes it.
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
  request and no legacy client. Its registry is `camelCase` and deploy-time only; today it declares
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
