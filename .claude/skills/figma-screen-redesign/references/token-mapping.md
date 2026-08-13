# Figma variables → classes

Read this when the resolver's output needs a judgement call, when a design uses effects or
unusual dimensions, or when you need to know what a token family is _for_ rather than what
it maps to.

The token files themselves are short and authoritative — `src/styles/new/semantics.css` and
`src/styles/new/typo.css`. When a question is "does this name exist", read them. When it is
"which of these names does the design mean", read this.

## Contents

- [The one rule that trips everyone](#the-one-rule-that-trips-everyone)
- [Colour families and what they are for](#colour-families-and-what-they-are-for)
- [Type](#type)
- [Spacing](#spacing)
- [Radius](#radius)
- [Shadows and effects](#shadows-and-effects)
- [Sizing and containers](#sizing-and-containers)
- [What must never appear in new markup](#what-must-never-appear-in-new-markup)

## The one rule that trips everyone

A token's name already contains its role, and the Tailwind utility prefix is added on top:

| token                      | utility                   | not                    |
| -------------------------- | ------------------------- | ---------------------- |
| `--color-bg-brand-solid`   | `bg-bg-brand-solid`       | ~~`bg-brand-solid`~~   |
| `--color-text-primary`     | `text-text-primary`       | ~~`text-primary`~~     |
| `--color-border-secondary` | `border-border-secondary` | ~~`border-secondary`~~ |
| `--color-fg-brand-primary` | `text-fg-brand-primary`   | ~~`fg-brand-primary`~~ |

The wrong forms are not merely unconventional — several of them are live _legacy_ class
names. `bg-primary` and `text-primary` both exist in `_theme-legacy.css` with different
values, so the mistake renders something plausible rather than nothing, and no error is
reported anywhere. This is the single highest-value thing to get right.

## Colour families and what they are for

Six prefixes, and they are not interchangeable. Untitled UI's distinction between `text-*`
and `fg-*` is the one most often collapsed by accident.

**`bg-*`** — surfaces. Page, card, input, button fill, section. `bg-primary` is the page's
white, `bg-secondary` a subtle grey fill, `bg-brand-solid` a filled brand button. The
`-hover` variants exist for exactly that: `hover:bg-bg-brand-solid-hover`.

**`text-*`** — text colour, and only text. `text-primary` is body copy at full contrast,
`text-secondary` and `text-tertiary` step down, `text-placeholder` is input placeholder
copy, `text-*-on-brand` is text sitting on a brand-filled surface. Reach for the `-on-brand`
family whenever the surface underneath is `bg-brand-*`; using plain `text-primary` there is
a contrast bug that reviews miss on a light-grey mock.

**`fg-*`** — foreground: icons, glyphs, indicators, anything drawn rather than typeset. In
this codebase icons ride on `currentColor`, so an `fg-*` token becomes a **text** utility on
the element wrapping the svg (`text-fg-quaternary`). Only when an icon hardcodes `fill` or
`stroke` do you need `fill-fg-*` / `stroke-fg-*`.

**`border-*`** — borders, and by extension dividers, outlines and rings when the design uses
the same colour there: `divide-border-secondary`, `outline-border-brand`.

**`utility-*`** — the badge, tag and chart ramps (`utility-success-500`,
`utility-blue-light-200`, …). These are semantic in that the design system assigns them to
statuses, but they carry no role prefix, so the utility prefix comes from the usage:
`bg-utility-success-50` with `text-utility-success-700` is the standard success badge.

**`alpha-*`** — translucent black and white for overlays, scrims and glass. A modal backdrop
is `bg-alpha-black-40`, not a hand-rolled `bg-black/40`.

**`components-*`** — tokens the design system scopes to one component (`components-toggle-border`,
`components-icons-featured-icon-light-fg-brand`). If you are building that component, use
them; they are not general-purpose colours. `effects-focus-ring` is the focus ring colour and
belongs on `focus-visible:ring-effects-focus-ring`.

## Type

Every text element needs **two** classes: a named text style and a family.

```
text-display-md-medium font-display    ← headings
text-lg-semibold font-body             ← body, labels, buttons
```

The text style carries size, line height, weight and letter spacing together. The family is
separate because Tailwind's `--text-*` namespace has no family slot — which means a text
style used alone silently inherits whatever family is above it.

Names in Figma and in the CSS differ in one small way. Figma calls the body styles
`text-lg-semibold`; the CSS custom property is `--text-lg-semibold`, so the class is
`text-lg-semibold` — the `text-` you write is the utility prefix, not part of the name.
Display styles keep the prefix in both: Figma `display-md-medium` → `text-display-md-medium`.

Available: display `xl`/`lg`/`md`/`sm`/`xs` in `medium` (plus `xs-semibold`); body
`xl`/`lg`/`md`/`sm`/`xs` in `regular`/`medium`/`semibold`/`bold`.

Never write `text-[15px] leading-6` or the legacy sizes to approximate a style. If the design
uses a size that is not on this list, that is a step-3 gap — the design file has a text style
the export does not, and the fix is upstream.

## Spacing

**The new export carries no spacing tokens** — only colour and type reach the stylesheet.
Spacing resolves through Tailwind's own scale, which is the same 4px ladder Figma uses, so
the mapping is arithmetic rather than a lookup:

| Figma         | px  | class   |
| ------------- | --- | ------- |
| `spacing-1`   | 4   | `p-1`   |
| `spacing-2`   | 8   | `p-2`   |
| `spacing-4`   | 16  | `p-4`   |
| `spacing-6`   | 24  | `p-6`   |
| `spacing-xxs` | 2   | `p-0.5` |
| `spacing-xs`  | 4   | `p-1`   |
| `spacing-sm`  | 6   | `p-1.5` |
| `spacing-md`  | 8   | `p-2`   |
| `spacing-lg`  | 12  | `p-3`   |
| `spacing-xl`  | 16  | `p-4`   |

Figma's numeric `spacing-N` is Tailwind's `N` directly. A value off the ladder
(`p-[15px]`) means the design file has an ad-hoc number in it — usually worth mentioning,
rarely worth blocking on.

Prefer flex/grid `gap-*` over margins where the design uses auto-layout, which it does almost
everywhere. Auto-layout _is_ gap, and translating it to margins loses the structure.

## Radius

Also not in the new export. The project moved Tailwind's `lg`/`md`/`sm` onto Figma's values,
so those three line up and the rest need care:

| Figma         | px   | class                                    |
| ------------- | ---- | ---------------------------------------- |
| `radius-none` | 0    | `rounded-none`                           |
| `radius-xxs`  | 2    | `rounded-xs`                             |
| `radius-xs`   | 4    | `rounded-[4px]` — no named step          |
| `radius-sm`   | 6    | `rounded-sm`                             |
| `radius-md`   | 8    | `rounded-md`                             |
| `radius-lg`   | 10   | `rounded-lg`                             |
| `radius-xl`   | 12   | `rounded-xl`                             |
| `radius-2xl`  | 16   | `rounded-2xl`                            |
| `radius-3xl`  | 20   | `rounded-[20px]` — `rounded-3xl` is 24px |
| `radius-4xl`  | 24   | `rounded-3xl`                            |
| `radius-full` | 9999 | `rounded-full`                           |

The two arbitrary values are deliberate. `--radius-*` is the one namespace where the old and
new systems use the same names for different values, so a second scale could not be added
alongside; ADR 0005 has the reasoning. Do not add radius tokens to make these look tidier.

## Shadows and effects

The export carries shadow **colours** (`effects-shadow-sm-01`, `effects-shadow-sm-02`, …) and
no shadow utilities, because an Untitled UI elevation is two or three stacked layers and there
is no token shape for that here.

So a design that uses `shadow-sm` has no direct translation. Three ways out, and this is a
step-3 question rather than a call to make alone:

1. Tailwind's own `shadow-sm` / `shadow-md` — close, not equal, and by far the cheapest.
2. An arbitrary value spelling out the layers, e.g.
   `shadow-[0_1px_3px_0_#0a0d121a,0_1px_2px_-1px_#0a0d121a]`.
3. A named `@utility` in `src/styles/_utilities.css` alongside the existing `shadow-raised`
   family — right if the elevation recurs across screens, overkill for one card.

The project already has hand-written `shadow-icon`, `shadow-raised` and `shadow-raised-lg`.
Those belong to the legacy design and are not the new elevations.

## Sizing and containers

`figma-variables.json` carries widths (`width-lg` 640, `width-xl` 768, `width-2xl` 1024,
`container-max-width-desktop` 1280, `container-padding-desktop` 32, `container-padding-mobile`
16). None reach the stylesheet.

Before hardcoding `max-w-[1280px]`, check what the surrounding layout already does — this
repo has container patterns in `src/components/layouts`, and a page that sets its own max
width inside a container that already sets one is a bug that only shows up at one specific
window size.

## What must never appear in new markup

- A raw hex, or an arbitrary colour value: `bg-[#1570ef]`, `text-[#181d27]`.
- A legacy colour name: `bg-primary`, `text-brand`, `border-input`, `bg-red`, `text-weak`.
  The full list is `src/styles/_theme-legacy.css`, and it is frozen.
- A legacy or ad-hoc size: `text-base`, `text-caption`, `text-[15px]`, `leading-6`.
- A Tailwind default palette name: `bg-slate-200`, `text-sky-500`. The colour namespace is
  cleared, so these render nothing at all.
- A primitive where a semantic exists: `bg-gray-50` instead of `bg-bg-secondary`. Primitives
  are legal but they discard the intent, which is the thing that survives a palette change.

Once the directory is in `MIGRATED_PATHS` in `eslint.config.mjs`, the linter reports the
legacy names. Until then nothing does, which is why the list is here.
