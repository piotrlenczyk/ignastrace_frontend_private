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

**Right now only part 1 is in scope.** Focus on design and UI implementation. Do not build API
clients, change data fetching, or refactor server actions unless explicitly asked — existing
data plumbing stays as it is until the design work lands.

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
