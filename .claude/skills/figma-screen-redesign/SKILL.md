---
name: figma-screen-redesign
description: Rebuilds an existing screen onto the new Ignastrace Figma design — capturing the design from Figma links, writing markup against the new colour tokens in src/styles/new and the named text styles, building any missing design-system component with cva and all its Figma variants, and then verifying the result in a real browser against the Figma reference. Use this skill whenever the user pastes a figma.com/design link and wants it built, or asks to implement, redesign, restyle, port or migrate a screen, page, section, modal or component onto the new design or new theme — including when they give separate mobile and desktop links, or an extra link for a modal or other state. Also use it when they ask why an implemented screen does not match Figma, or want an already-rebuilt screen checked against the design. Not for pulling tokens out of Figma (that is figma-design-tokens) and not for changing what a screen does.
---

# Figma screen → new design

Rebuild a screen's **appearance** against the new design system. The screen keeps doing
exactly what it did before.

That boundary is the whole shape of this task, so it is worth being concrete about. The
project is a legacy mobitrace.io frontend being rewritten onto a new Figma design; wiring it
to the new API is a separate programme of work that has not started. So a screen coming out
of this skill fetches the same data, posts to the same actions, validates with the same
schemas and routes to the same places as the screen going in. What changes is markup and
classes.

Read `CLAUDE.md` at the repo root before starting if it is not already in context — it
carries the project rules this skill assumes.

## What you are given, and what to ask for

The user pastes Figma links. Expect between one and several, and work out what each is:

- One link → one screen at one breakpoint. Ask which breakpoint it is if the frame name
  does not say, and ask whether the other one exists.
- Two links → almost always mobile and desktop of the same screen. Both are needed before
  writing anything, because a responsive component written from the desktop frame alone
  gets rebuilt rather than adjusted when the mobile frame arrives.
- A third or further link → a state: a modal open, a dropdown expanded, an error, a loading
  skeleton, an empty list. These become states of the same component, not separate screens.

A link needs a `node-id` to be usable: `figma.com/design/<fileKey>/<name>?node-id=1-2` gives
fileKey `<fileKey>` and nodeId `1:2`. A link without one points at the whole file and there
is nothing specific to read — ask for a link to the selected frame.

Also establish, if the user has not said, **which route or component in this repo the design
replaces**. Ask rather than infer from the frame name: the design file and the codebase were
named by different people at different times, and `Checkout` in Figma is not reliably
`src/app/[locale]/checkout`. You need the real path both to edit it and to open it in a
browser at the end.

## Step 1 — Capture the design

Before the first `get_design_context` call, load the `figma:figma-design-to-code` skill.
That tool's own contract requires it, and skipping it produces code written against Figma's
generic idea of a React component rather than this project's.

For **each** link, in this order:

1. `mcp__plugin_figma_figma__get_screenshot` with `maxDimension: 2400`. Download the PNG
   from the returned URL with curl into `.tmp/figma-screens/<screen-slug>/` as
   `figma-<breakpoint-or-state>.png` — `.tmp/` is gitignored. Then read it. Prefer the
   curl-plus-Read path over `enableBase64Response` — same image, far fewer tokens, and you
   need the file on disk anyway to compare against at the end.
2. `mcp__plugin_figma_figma__get_variable_defs` — the variables bound in the node. This is
   the authoritative answer to "which token did the designer mean", and it is the reason
   this skill exists rather than colour-picking a screenshot. Save the raw output to
   `.tmp/figma-screens/<screen-slug>/vars-<breakpoint>.txt`.
3. `mcp__plugin_figma_figma__get_design_context` — structure, hierarchy, auto-layout,
   spacing, and any image or icon assets to download. Treat its generated code as evidence
   about the design, not as code to paste: it knows nothing about this repo's components,
   tokens or conventions.

If a frame is large enough that `get_design_context` returns metadata instead of code, use
`get_metadata` to get the node tree and then pull the sections in separately. Rebuilding a
long page section by section is normal and works better than one enormous call.

## Step 2 — Resolve every variable to a class

Run the bundled resolver over the variable names you saved. It does the name matching
mechanically, which matters because the two vocabularies are close enough that a near-miss
reads as a hit — `text-tertiary` where the design said `text-tertiary-brand` looks right in
review and is wrong:

```bash
node .claude/skills/figma-screen-redesign/scripts/resolve-figma-vars.mjs \
  .tmp/figma-screens/<screen-slug>/vars-desktop.txt
```

It accepts one name per line or `get_variable_defs`' JSON, prints the class to write for
each name, and lists the gaps. Exit code 1 means there are gaps.

Two things about the output are worth internalising rather than looking up each time:

- **The doubled prefix is correct.** The token is `--color-bg-brand-solid`, so the utility
  is `bg-bg-brand-solid`; likewise `text-text-primary`, `border-border-secondary`. It reads
  like a typo and is not one. Writing `bg-brand-solid` instead names nothing and renders
  transparent, silently.
- **A text style does not set a typeface.** `text-lg-semibold` sets size, line height,
  weight and tracking; the family is a separate `font-body` or `font-display` class.
  Every text element gets both.

`references/token-mapping.md` covers what the resolver cannot: which of the token families
means what, how spacing and radius resolve (they are _not_ in the new export — only colour
and type are), and the shadow situation. Read it when the resolver's suggestion needs a
judgement call, or when a design uses effects, and note that fresh eyes on the token files
themselves — `src/styles/new/semantics.css`, `typo.css` — settle most questions faster than
any summary.

## Step 3 — Collect the gaps, then ask once

By now you know everything the design needs. Gather every open question into **one** round
and put it to the user with `AskUserQuestion` before writing code. One round rather than a
question per gap: a busy screen has several, they are usually related, and answering them
together is quick where being interrupted six times is not.

Four kinds of gap come up:

1. **A layer with no variable bound** — a raw hex, a detached style. Nothing in the token
   files corresponds to it, so there is no right answer to derive. Show the value and the
   nearest semantic tokens.
2. **A variable the codebase does not have.** Usually `figma-variables.json` is older than
   the design file. The fix is re-running the export (the `figma-design-tokens` skill), not
   a hand-written token — say so, and offer it as one of the options.
3. **A dimension the new system deliberately does not carry** — shadows especially. The
   export has shadow _colours_ and no shadow utilities, and Tailwind's own `shadow-*` is
   close to Untitled UI's but not equal to it. Ask which way to go.
4. **A design-system component with no implementation yet.** This one is work rather than a
   question: build it (step 4). Report the scope so the user knows what the screen costs —
   "this needs a Badge and a Tooltip that do not exist yet" — but do not block on it.

Resist the pull to pick the nearest token and move on. The point of naming variables in
Figma is that the mapping is not a matter of taste, and a silent guess here is invisible
in review — it looks like a decision someone made.

## Step 4 — Implement

**Components first, then the screen.** A screen assembled from components that exist is
straightforward; a screen written with the components inlined has to be taken apart later.

New and rebuilt components go in **`src/components/ui/v2/`**. `src/components/ui` is the
old design system and is frozen — do not add new-design variants to its files. The two
directories coexist the way the two stylesheets do, and the old one is deleted whole when
the last screen lands.

Follow `references/components-cva.md` for the component contract: one `cva` definition,
variants named after the Figma component-set properties, every variant and state the Figma
set defines (not only the ones this screen uses), `VariantProps` in the exported props type,
`cn` from `@/libs/utils`, Radix kept wherever the old component used it. The reason for
building the whole variant matrix rather than just what is on screen is that the next screen
needs the rest, and finding out then means editing a component someone has already reviewed.

For the screen itself:

- **Do not touch logic.** Same server/client split, same data fetching, same server
  actions, same `react-hook-form` and zod schemas, same routes and redirects, same
  `next-intl` calls. If the design shows something the page has no data for, render it from
  what exists or from the design's own copy, and flag it in the report. Adding a fetch or an
  API call is out of scope even when it looks like the obvious next step.
- **Copy goes under `__NEW__`** in `src/locales/en.json`, nested by screen, English only.
  New keys even where the wording matches an existing string — the legacy keys retire with
  the legacy screens. Do not touch any other locale file; translations are another team's.
- **Responsive from both frames.** One component, Tailwind breakpoints — mobile frame as the
  base and `lg:` upward for desktop, since the project's `lg` is 1024px and desktop frames
  are drawn at 1280 or 1440. Breakpoints are `xs` 360, `sm` 640, `md` 768, `lg` 1024,
  `xl` 1280, plus a `md-max` custom variant for max-width queries. Two separate components
  behind a media query is a last resort, for when the mobile and desktop designs are
  genuinely different structures rather than one that reflows.
- **Icons** come from `src/components/ui/icon`. Download any new SVG from the design context
  into `src/components/ui/icon/svgs` and run `npm run generate:icons`.
- When a route directory or component directory is **fully** rebuilt, add it to
  `MIGRATED_PATHS` in `eslint.config.mjs`. That switches on the lint rule that reports
  legacy colour and size classes in those files, so the screen cannot regress. Adding a
  path that is only half rebuilt just produces noise, so wait until it is done.

## Step 5 — Verify in a real browser

Assume the dev server is already running; do not start it, and do not run `build`.

```bash
node .claude/skills/figma-screen-redesign/scripts/review-screen.mjs \
  --url /checkout \
  --out .tmp/figma-screens/<screen-slug>
```

It opens a real Chrome window at 1440x900 and 390x844, captures full-page screenshots and a
computed-style audit per viewport, and reports console errors. For the state links, pass
interactions — they accumulate, so a sequence lands on the state you want:

```bash
  --steps '[{"label":"modal","click":"[data-testid=open-modal]"},
            {"label":"modal-hover","hover":"[role=dialog] button[type=submit]"}]'
```

`--pause` waits for Enter before capturing, which is how you handle an authenticated route:
log in by hand in the open window, then continue. English is the default locale with
`as-needed` prefixing, so `/checkout` works without a locale segment. Full option list is in
the script's header.

Then compare, and compare in both registers, because they fail differently:

- **Read the PNGs side by side** with the Figma reference from step 1. This is what catches
  structural mistakes — wrong order, a missing element, something centred that should be
  left-aligned, a card that does not fill its column.
- **Read `audit-<viewport>.json` against the Figma variable values.** This is what catches
  the mistakes that decide whether a redesign looks right: a 15px font where the design says
  16, `rgb(65, 70, 81)` where the token resolves to `rgb(83, 88, 98)`, a 12px radius that
  should be 10, `lineHeight: normal` where a text style should have set it. None of those are
  visible in a screenshot at any zoom, and all of them are exactly what token-driven markup
  gets wrong.

Fix what you find and re-run. Two or three rounds is normal. Stop when the remaining
differences are ones you can name and defend, and put them in the report rather than
quietly leaving them — "the shadow is Tailwind's `shadow-sm`, not Untitled UI's two-layer
`shadow-sm`, per your decision in step 3" is a useful sentence; silence is not.

Finish with `npm run check-types` and `npm run lint`.

## Step 6 — Report

Keep it short and specific:

- Files added and changed, with the route now rebuilt.
- Components built in `src/components/ui/v2/`, and which Figma variants each covers.
- Gaps from step 3 and what was decided for each.
- Anything the design asks for that the page has no data for.
- Screenshot paths, so the user can look at the same pair you compared.
- Whether `MIGRATED_PATHS` was extended, and if not, what is still legacy in that directory.

## When the design and the codebase disagree

Some of these come up on most screens:

- **The design shows a component that exists in `ui/v2` but with a variant it lacks.** Add
  the variant to the existing component. Do not fork it, and do not override it with
  one-off classes at the call site — the next screen will need the same thing and will not
  find it.
- **The design shows a legacy component restyled.** Build the v2 version and switch this
  screen to it. Leave the legacy component alone: other screens still render it, and it is
  frozen for exactly that reason.
- **The design implies interaction the page does not have** — a modal where there was a
  page, a stepper where there was a single form. This crosses out of appearance into
  behaviour. Say so and ask; do not build it as though it were styling.
- **The design is missing a state the code produces** — a validation error, an empty list, a
  loading state. Keep the existing behaviour and style it with the new tokens, following the
  design's patterns for similar states, and mention it in the report.
