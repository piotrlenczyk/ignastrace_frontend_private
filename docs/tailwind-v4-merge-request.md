# Migrate Tailwind CSS v3 → v4, with the theme ported into CSS

Closes #1.

Tailwind v3.4 → v4.3, the theme moved out of `tailwind.config.ts` and into CSS
`@theme`, the config file deleted, and the PostCSS pipeline reduced from five
plugins to one. **Parity-first**: v4's changed defaults are shimmed back to
their v3 values so this change carries no visual delta of its own, and the
follow-up that adopts them is a separate, deliberate review.

You can approve this on "the pixels did not move" rather than adjudicating a few
dozen small visual judgements at the same time as a tooling change. The evidence
for that claim is below, and in full in `docs/tailwind-v4-migration-notes.md`.

## What changed

|         |                                                                                                                                                            |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Removed | `tailwindcss@3`, `tailwindcss-animate`, `eslint-plugin-tailwindcss`, `postcss-import`, `@tailwindcss/nesting`, `autoprefixer`, `cssnano`                   |
| Added   | `tailwindcss@4`, `@tailwindcss/postcss`, `tw-animate-css` (pinned `^1.4.0`, below the announced breaking major)                                            |
| Deleted | `tailwind.config.ts` — the theme now lives in `src/styles/_theme.css` as `@theme inline`                                                                   |
| PostCSS | five plugins → one. Production CSS minification is left to Next, which already does it; `cssnano` additionally mangles the `@property` rules v4 depends on |

**Browser support floor rises to Safari 16.4+ / Chrome 111+ / Firefox 128+.**
This is a hard requirement of v4 (`@property`, `color-mix()`), not a choice made
here.

The commits are independently reviewable in order: prefactor (still on v3) →
dependency and theme swap → utility renames → ADRs → verification and fixes.
The app does not build between the first and second, which is expected.

## How parity was verified

The unit suite cannot see any of this — it runs in a DOM simulation that never
loads the stylesheet. Two purpose-built seams were used instead, both built and
validated _before_ any migration work, since the v3 baseline is unreproducible
once dependencies change.

**Seam 2, the gate — full-page screenshots, 12 pages × 2 viewports, production
builds of v3 and v4 served side by side.** 17 of 24 shots pixel-identical,
including every form page. The rest:

| shots                                            | difference                                              | verdict                                     |
| ------------------------------------------------ | ------------------------------------------------------- | ------------------------------------------- |
| `about`, `find-phone`, `home`, `track` — desktop | 6px shorter                                             | accounted for: the `leading-*` change below |
| `pricing` — desktop                              | 876 px, all ±1 of 255 on glyph edges                    | accounted for: the zero-width outline below |
| `reverse-phone-lookup` ×2                        | 45,000–59,000 px **between two runs of identical code** | not gateable; on the manual checklist       |

Same-code noise was measured, not assumed: the v4 build is pixel-identical to
itself across two runs on all 22 gated shots, and v3 to itself on 21 of 22.

**Seam 1, the coverage backstop — the compiled stylesheet**, which contains
every generated utility including those only used on pages a browser cannot
reach. It was used to settle the two questions the plan had assumed rather than
proven, and both came out clean:

- Promoting four classes into the utilities cascade layer **did not change their
  precedence**. All 41 class strings in the codebase that use a promoted class
  were rendered under both sheets: of 124 probes, the only difference is
  `rounded-full` (`9999px` vs `calc(infinity * 1px)`), which renders
  pixel-identically at every size tested.
- The relocated third-party payment-form styling **is inert**. One rule, nothing
  in either sheet competes with it, identical computed padding under both.

The verification harness is throwaway migration tooling and is not committed.

## Two regressions found by the gate, and fixed

Both came from the version swap, not the renames — proven by capturing three
points (v3 / pre-rename v4 / post-rename v4) rather than two.

1. **Form label spacing collapsed by 8px everywhere.** v4's `space-y-*` moved
   the gap onto the _earlier_ sibling, which in every `FormItem` is a
   `display: inline` label, where vertical margins do nothing. `Label` is now
   `inline-block` — the smallest change that restores the spacing _and_ keeps
   the label's click target the width of the text. This was the entire 12,000–
   50,000-pixel residual on login, sign-up, contact and cancellation; all four
   are now pixel-identical.
2. **Buttons grew a permanent white halo.** v4's `ring-offset-*` sets the offset
   shadow itself, where v3 left it to the `ring-*` utilities — so on any button
   also carrying a `shadow-*` it painted a 2px white ring that clipped the drop
   shadow. `ring-offset-2` is now scoped to `focus-visible:`, which reproduces
   v3 exactly.

## Behaviour changes accepted rather than shimmed

Each is v4 fixing something rather than breaking it. Nothing here is a
side-effect nobody noticed — these are the deliberate calls.

1. **Hover no longer sticks on touch devices.** v4 gates hover behind a
   hover-capable media query. On a mobile-heavy product this is a fix. Needs a
   real device to confirm — it is on the manual checklist.
2. **`space-y-*` changed selector and margin direction.** Where that produced a
   real regression it was fixed (above). The change itself is kept.
3. **`fill-current` now resolves.** v3's palette replaced Tailwind's defaults
   and had no `current` entry, so the class was dead and the radio indicator in
   `dropdown-menu.tsx` rendered **black**; it now renders in the inherited text
   colour. This is the one dead-colour-utility fix with a visible effect —
   please confirm the new colour is wanted.
4. **New, found during verification: `leading-*` now beats a later `text-*`.**
   v4's font-size utilities defer their line-height to `--tw-leading`, so an
   explicit `leading-6` wins over `lg:text-lg`'s paired line-height where under
   v3 the later utility won. Two components render a heading at 24px instead of
   27px, which is the whole of the 6-pixel difference on four desktop pages.
   Accepted on the same reasoning as the others — the author wrote `leading-6`
   and v4 honours it — but it was not on the original list, so it wants a
   decision. `docs/tailwind-v4-migration-notes.md` gives the one-line reversal
   per site if you would rather keep v3's rendering.

## Two claims from the original ticket that did not survive measurement

Recorded because the ticket asserted them and a reviewer will be looking for
them.

- **"Opacity modifiers on themed colours currently do nothing and begin working
  under v4."** They already worked. Tailwind v3.3+ injects alpha into
  `hsl(var(--x))` colours automatically, so v3 emitted
  `hsl(var(--foreground) / 0.5)` and rendered `rgba(10, 10, 10, 0.5)`. v4 emits
  a `color-mix()` and renders the same colour. Checked for every colour opacity
  modifier in the codebase — `text-foreground/50`, `bg-destructive/10`,
  `bg-black/80`, `bg-white/80`, `border-muted/40`, `border-destructive/30`.
  Nothing to review.
- **"Three colour utilities render nothing and will continue to."** Only one of
  the three has any effect either way. `text-current` sets `color: currentColor`,
  which is what the element already inherits — a no-op in both versions, at both
  of its call sites. `fill-current` is the real one, and it is now live (item 3
  above).

## Known losses

**Tailwind lint coverage is gone.** `eslint-plugin-tailwindcss` was removed
rather than upgraded: it cannot parse v4, and its v4-compatible line is still
pre-release, where it errors on every custom class in this codebase. Three rules
go with it, with no replacement:

| Rule                  | What it caught                                                                                |
| --------------------- | --------------------------------------------------------------------------------------------- |
| `no-custom-classname` | Typos in utility names. **These now fail silently at runtime.**                               |
| `classnames-order`    | Class attributes not in canonical order. A class-sorting formatter is a reasonable follow-up. |
| `enforces-shorthand`  | `mt-2 mb-2` where `my-2` would do.                                                            |

`stylelint`'s at-rule allowlist was updated for v4's directives; it is otherwise
unchanged, still with the same 11 pre-existing `color-hex-length` errors in the
frozen token directory.

**Emitted CSS grew 91,841 → 108,627 bytes (+18%)**, measured on the two
production builds used for the gate. (`tailwind-v4-migration-notes.md` records
91.8 KB → 107.9 KB from the swap commit — the same v3 figure, and an earlier v4
build in the series, before the renames and the two fixes below. Not a
contradiction.) Three understood causes: v4 does not
tree-shake hand-written `@layer components` rules, v4 emits 72 `@property`
registrations plus an `@supports` fallback block, and `tw-animate-css` ships
duplicate accordion keyframes. Build time is unchanged — 28.2s v4 against 28.8s
v3, measured back to back from an empty `.next` at the swap commit.

## Deliberately out of scope

- **The Figma token pipeline is frozen** — `src/styles/new/`, the generator and
  its JSON input are untouched and unimported. The freeze is enforced
  structurally: content scanning is an explicit allowlist that excludes them, so
  they cannot contribute class names even by accident.
- **The parity shims stay.** v3's border colour, placeholder colour and button
  cursor are restored, grouped and commented at the top of `_base.css` so the
  follow-up removal is one edit.
- Rewriting `space-y-*` as flex `gap`, replacing the lost lint rules, migrating
  to current shadcn/ui v4 conventions, a committed visual-regression suite,
  dark mode (the codebase has none), and any other dependency upgrade.

## Before merging

- `docs/tailwind-v4-manual-checklist.md` — the nine styling features on routes
  the gate cannot reach, plus the two behaviour changes that need a real device.
  Shorter than it looks: all nine were also compared under both compiled sheets
  and came out identical, so what is left is composition and live animation.
- Two decisions are recorded as ADRs in `docs/adr/`: why content sources are
  declared explicitly instead of auto-detected, and why the colour
  custom-property indirection was kept rather than flattened.
- **Unrelated, pre-existing, and not touched here:** a heading on the sign-up
  page renders truncated copy — an apparently missing interpolation. It is in
  the baseline screenshots too. Do not read it as a regression.
