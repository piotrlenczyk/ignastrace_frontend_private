# Tailwind v4 migration — manual QA checklist

The pixel gate (issue #6, seam 2) reaches twelve public pages at two viewports.
Everything below is on a route it cannot reach: several redirect away without
funnel state, and the member area needs authentication. This is the list of
what a human has to open.

**It is shorter work than it looks.** Every one of these features was also put
through seam 1 in a form that does not need a browser session: each class was
rendered under the v3 compiled stylesheet and under the v4 compiled stylesheet
in a static page, and _every_ computed property was compared. Twelve came out
byte-identical; the other eight differ in one value only — `rounded-full`, which
v3 writes as `9999px` and v4 as `calc(infinity * 1px)` — and that value was
separately proven to render pixel-identically at every size tested. So no
declaration changed on any of the twenty. See "The unreachable features,
measured" in `tailwind-v4-migration-notes.md` for the method. (If you re-run the
probe yourself it prints "8 differ" — that is this one value, nothing else.)

So what remains is **not** "does this styling still work" — the declarations are
proven unchanged. It is "does it still compose correctly in real markup", which
is the part a static probe cannot see: stacking against sibling utilities, real
content lengths, live animation, and the two behaviour changes below that the
probe deliberately excludes.

Check each at desktop (1440) and mobile (390) unless noted.

## The nine features

| #   | Feature                 | Route                                                                                                               | Class(es)                                                                                                   | What to look at                                                                                                                                                                                                                                                                                                                                                                                                |
| --- | ----------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Funnel container        | `/search`, `/lookup-search` (needs funnel state)                                                                    | `.funnel-container`                                                                                         | Loader content stays centred both axes.                                                                                                                                                                                                                                                                                                                                                                        |
| 2   | Located background      | `/search-complete` (needs funnel state)                                                                             | `.funnel-container-located`, `.search-located-bg`                                                           | Background photo covers and stays centred; the blurred disc is a circle, is fixed, and keeps its 12px translucent ring. Check at both viewports — the disc has an `lg:` size step (324px → 560px).                                                                                                                                                                                                             |
| 3   | Order table             | `/success` (needs a completed order)                                                                                | `.order-table`                                                                                              | Column widths, row borders and the small text size. Long product names are the stress case.                                                                                                                                                                                                                                                                                                                    |
| 4   | Product-card dialog     | `/success` upsell                                                                                                   | `ProductCards` in `upsell-page-client.tsx`                                                                  | Dialog opens, card grid does not overflow, close button sits top-right.                                                                                                                                                                                                                                                                                                                                        |
| 5   | Animated input border   | `/memberarea/find-by-link` and its `/success`                                                                       | `.input-animated-border`, `.input-animated-border-secondary`                                                | The conic-gradient border **rotates** — the static probe freezes it, so motion is genuinely unverified. Also check focus (`:has(input:focus)`) and the invalid state (`:has(input[aria-invalid='true'])`).                                                                                                                                                                                                     |
| 6   | Badge variants          | `/memberarea/settings/billing` **and `/memberarea/status`**                                                         | `.badge-active`, `.badge-canceled`, `.badge-expired`; `.badge-located`, `.badge-pending`, `.badge-rejected` | Pill shape, and that the colour trio (bg / text / border) still matches per state. The six classes are **three** rules: `located`+`active` (green), `pending` (gray), `rejected`+`canceled`+`expired` (red). Billing shows the green and red ones; **`/memberarea/status` is the only place the gray `pending` badge renders**, via `STATUS_CLASSES` in `status/_page/constants.ts`, so it needs its own look. |
| 7   | Globe treatments        | `/memberarea/status` empty state, `/memberarea/sex-offenders`, `/memberarea/find-by-number/message-sending/success` | `.globe`, `.globe-map`                                                                                      | Circle, drop-shadows, and the **`animate-map-pane` pan**, which the frozen probe cannot see.                                                                                                                                                                                                                                                                                                                   |
| 8   | Desktop shell layout    | any `/memberarea` page, ≥1024px only                                                                                | `.lg:layout-desktop` on `product-layout.tsx`                                                                | This is the highest-value item in the list: `layout-desktop` is one of the classes promoted to `@utility` so that the `lg:` variant would generate at all. Under v3 the variant came from the component layer; if the promotion had gone wrong the whole member-area shell would be unstyled above 1024px. Confirm the panelled full-height layout appears at ≥1024px **and is absent below it**.              |
| 9   | Caller information card | reverse-lookup report                                                                                               | `.caller-info-card`                                                                                         | The `::before` accent bar on the left edge, and that the card still clips (`overflow-hidden`).                                                                                                                                                                                                                                                                                                                 |
| 9b  | Progress bar            | reverse-lookup owner information card                                                                               | `.progress-bar` + `.progress-bar-30` / `.progress-bar-60`                                                   | It must **fill over 30s / 60s**. The animation is what matters and it is frozen in the probe. `.progress-bar-100` has no call site.                                                                                                                                                                                                                                                                            |

## Also not covered by the pixel gate

- **`reverse-phone-lookup`** is excluded from the gate entirely: its content is
  non-deterministic and it differs by 42,000–67,000 pixels between two runs of
  _identical_ code. Items 9 and 9b live on it. Give the whole page a look.
- **`/l/[id]`** and **`/search-complete`** use the bare `.container` class.
  `/contact` also uses it and _is_ gated, so the class itself is covered; these
  two are only unverified for their own additional styling.
- **`/checkout`**, **`/thank-you`** — redirect away without funnel state.

## Two behaviour changes to confirm on a real device

Both are accepted, not regressions — see the merge-request write-up. They need a
human because no automated seam here can produce the input.

- [ ] **Hover no longer sticks after a tap.** On a real touch device (not a
      desktop browser's device emulation, which reports hover capability
      differently), tap a button or a nav link and then tap elsewhere. Under v3
      the hover styling stayed on until you touched something else. It should
      now clear immediately.
- [ ] **The dropdown radio indicator changed colour.** `fill-current` was dead
      under v3 (the palette replaced Tailwind's defaults and had no `current`),
      so `DotFilledIcon` in `dropdown-menu.tsx` rendered **black**. Under v4 it
      resolves and renders in the inherited text colour. This is the only one of
      the reported "dead colour utilities" with a visible effect — confirm the
      new colour is wanted.

## Fixes made during verification — worth a second pair of eyes

Both are in `src/components/ui/`, so they touch every form and every button,
including the reachable pages. The pixel gate covers them there; these are the
places it does not reach.

- [ ] **Form label spacing** (`label.tsx`, now `inline-block`). Check any
      member-area form — `/memberarea/settings/my-account` has ten `FormItem`s,
      including two in a `flex flex-row` row. The gap between label and input
      should be 8px, and label click targets should still be the width of the
      text, not the full row.
- [ ] **Button focus ring** (`button.tsx`, `ring-offset-2` moved under
      `focus-visible:`). Tab to a button anywhere and confirm the focus ring
      still has its 2px gap; then confirm at rest that buttons carrying a
      `shadow-*` show their full drop shadow with no white halo.
