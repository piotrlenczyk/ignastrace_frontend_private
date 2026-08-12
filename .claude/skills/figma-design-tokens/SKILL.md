---
name: figma-design-tokens
description: Extracts every color, variable and text style from the project's Figma file into figma-variables.json — split into primitives vs semantics, and further split by source (local file vs the shared "Corporate Design System" library), light mode only. Use this skill whenever the user wants to pull, refresh, re-sync or update design tokens, variables, colors, typography or text styles from Figma, mentions figma-variables.json, asks "what colors/tokens does the design use", or pastes a figma.com/design URL and wants the tokens rather than a screen implemented. Also use it when tokens in the codebase look stale and need reconciling with Figma.
---

# Figma → figma-variables.json

Pull the design system out of Figma as data, so the codebase has one honest source of
truth for colors, spacing, typography and text styles instead of hand-copied hex values.

**Default target:** `Ignastrace.io`, fileKey `P49JZ2fY4oCoD25vpUQXNU`.
If the user gives another Figma URL, take the fileKey from it (`figma.com/design/<fileKey>/…`)
and use that instead — everything below is file-agnostic.

**Default output:** `figma-variables.json` in the repo root.

## What the output has to say

Two questions decide where every token lands. Keep them separate in your head — they
are orthogonal, and conflating them is the main way this task goes wrong.

1. **Is it a primitive or a semantic?** A variable holding a *raw* value (`#0a3d29`, `16`,
   `"Inter"`) is a primitive. A variable that *aliases another variable* is a semantic —
   it expresses intent ("text-primary") by pointing at a primitive. This is a property of
   the data, not of the variable's name, so read `valuesByMode`, never guess from naming.
2. **Where does it come from?** Variables local to the Figma file (`remote: false`) are this
   project's own — usually brand overrides. Variables coming from the shared
   **Corporate Design System** library (`remote: true`) are owned by another team and must
   not be edited here. Developers need to know which is which before they touch anything,
   which is the whole reason for the split.

Third-party UI kits subscribed to the file (Apple's iOS kit, Material, etc.) are *also*
`remote: true` but are not the design system. They must be excluded — see
"Choosing which collections count" below.

## Output shape

```json
{
  "primitives": { "corporate": { "gray-900": "#181d27" }, "local": { "primary-color-600": "#1570ef" } },
  "semantics":  { "corporate": { "text-primary": "gray-900" }, "local": { "bg-brand-solid": "primary-color-600" } },
  "shadows":    { "corporate": { "effects-shadow-xs": "#0a0d120d" }, "local": {} },
  "spacing":    { "corporate": { "spacing-xl": 16 }, "local": {} },
  "radius":     { "corporate": { "radius-md": 8 }, "local": {} },
  "sizing":     { "corporate": { "width-lg": 640 }, "local": {} },
  "typography": { "corporate": { "font-size-text-md": 16 }, "local": {} },
  "textStyles": { "corporate": { "text-md-semibold": { "fontFamily": "font-family-body", "…": "…" } }, "local": {} },
  "_meta": { "…": "provenance, mode used, what was excluded" }
}
```

**`primitives` and `semantics` hold colors and nothing else.** Figma keeps spacing, radii,
widths and shadow colors in the same variable tree, but they are consumed by different parts
of the code, and mixing them means every consumer has to re-sort them — and "how many colors
do we have" stops having an answer. So each gets its own section.

Which section a token lands in is decided by the **type of the value at the end of its alias
chain**, not by its name: a token that resolves to a number cannot be a color, whatever it is
called. Names only pick *which* dimension section it goes to. Anything numeric that fits none
of the named dimension sections lands in `dimensions`, which only appears when it is non-empty.

- **Semantics resolve to a primitive *name*, not a value.** The indirection is the point —
  it survives a palette change. A semantic pointing at another semantic keeps that name;
  don't flatten the chain.
- **Dimensions resolve to final numbers.** The same indirection earns nothing for a 16px step
  — nobody re-points it at a different number — and a plain number is what a Tailwind or CSS
  config actually wants. `spacing` therefore holds both the raw ladder (`spacing-4: 16`) and
  the t-shirt scale (`spacing-xl: 16`).
- **Light mode only.** Where a collection has Light/Dark modes, read the light one and emit
  a flat string. No `{light, dark}` objects — dark mode is deliberately out of scope for now,
  and adding it back later is a one-line change in `assemble.mjs`.
- `_meta` records the file, the mode picked per collection, the collections included and —
  importantly — the ones skipped. Silent exclusion is how a missing token becomes a
  two-hour debugging session, so anything dropped gets named.

## Procedure

The Figma MCP truncates tool responses at roughly 20 kB. A real design system is far bigger
than that, so this runs as: discover → extract per collection → assemble on disk. Each step
stays small enough to come back intact.

Before the first `use_figma` call, load the `figma:figma-use` skill — it is a hard
prerequisite of that tool.

### 1. Discover the collections

Run `scripts/01-discover.js` via `use_figma` (pass the file's contents as `code`).
It seeds from local variables plus variables bound on the first page, then walks the alias
graph outward, so it finds collections that are only reachable indirectly — notably the
primitives collection that the semantic colors alias into.

It returns one line per collection: id, name, remote flag, modes, variable count, and a few
sample variable names. That sample is what you classify on.

### 2. Choose which collections count

Decide, per collection, whether it is `corporate`, `local`, or excluded. Judge by the sample
names, and prefer being explicit over being clever:

- `remote: false` → `local`.
- Corporate Design System collections in this org follow the Untitled UI convention:
  `_Primitives`, and numbered ones like `1. Color modes`, `2. Radius`, `3. Spacing`,
  `4. Widths`, `5. Containers`, `6. Typography`.
- Everything else that is remote is a third-party kit → exclude. Tells: iOS/Apple naming
  (`Shape`, `_Theme`, `Dimensions`, `Colours semantic`), SF Pro fonts, or a generic
  `Variable collection` name on a remote collection.

If a collection is genuinely ambiguous, ask the user rather than guessing — a wrong call
here quietly poisons every downstream token.

### 3. Extract

Run `scripts/02-extract-variables.js` once **per collection**, editing the `COLLECTION_ID`
constant at the top to the collection you want. One collection per call keeps each response
under the truncation limit. Write each response's `rows` to
`.tmp/figma-tokens/vars-<n>.json`.

Then run `scripts/03-extract-text-styles.js` once and write it to
`.tmp/figma-tokens/text-styles.json`. It reads text styles off TEXT nodes because the
styles live in the library, not locally, so there is nothing to enumerate directly.

If a single collection still overflows 20 kB, set `OFFSET`/`LIMIT` in the script and call it
twice — the rows are stable-ordered, so slices concatenate cleanly.

### 4. Assemble

```bash
node .claude/skills/figma-design-tokens/scripts/assemble.mjs \
  --input .tmp/figma-tokens \
  --output figma-variables.json \
  --corporate "_Primitives,1. Color modes,2. Radius,3. Spacing,4. Widths,5. Containers,6. Typography" \
  --file-name "Ignastrace.io" --file-key P49JZ2fY4oCoD25vpUQXNU
```

`--corporate` takes collection **names** (comma-separated) from step 2. Anything present in
the input but not listed and not local is excluded and reported in `_meta.excluded`.

The script owns naming, so token names stay consistent run over run. It turns a Figma path
into a slug: drops annotations that merely restate the value (`(900)`, `(320px)`) and the one
naming the mode being exported (`(light mode)`), kebab-cases, drops a redundant leading
`Colors` segment, and collapses a group name that repeats in its children — verbatim
(`Text/text-primary`), abbreviated (`Background/bg-primary`) or pluralised
(`Focus rings/focus-ring`). So `Colors/Text/text-primary (900)` becomes `text-primary`, not
`colors-text-text-primary`.

Annotations naming a *different* mode are deliberately kept, which is why the dark ramp comes
out as `gray-dark-mode-900` next to `gray-900`. Dropping it would make the two collide and one
would silently overwrite the other — a wrong hex under a name that looks right. Any collision
that still happens falls back to the full path and is listed in `_meta.collisions`; a non-empty
list there is worth reading, not ignoring.

### 5. Report

Print a short summary: counts per section and per source, the mode used per collection,
and anything excluded or collided. Then diff against the previous `figma-variables.json` if
one existed and call out tokens that were removed — a disappearing token usually means a
renamed variable in Figma, not a deleted one, and it will break the code that referenced it.

## Notes worth keeping

- `figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync()` returns `[]` in this MCP
  context, and `search_design_system` does not return variables here either. That is why
  library membership is inferred from collection names instead of being read directly —
  if a future Figma release makes those work, prefer them.
- Remote collections *do* expose their full `variableIds`, so one seed variable is enough to
  enumerate an entire library collection. That is what makes step 1 → step 3 work.
- `figma.getLocalTextStylesAsync()` is empty here; all text styles are remote.
