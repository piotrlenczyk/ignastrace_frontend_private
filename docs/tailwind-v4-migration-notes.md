# Tailwind v4 migration — reviewer notes

Notes accumulated by the commits that make up the Tailwind v3 → v4 migration
(issue #1). Each section is material a reviewer needs that the diff does not
show on its own. The final sign-off report is issue #6.

## Lost tooling coverage — since restored (issue #8)

### Tailwind ESLint rules (removed in the v4-compatible prefactor, issue #2)

`eslint-plugin-tailwindcss` was **removed rather than upgraded**. It cannot parse
Tailwind v4, and its v4-compatible line is still pre-release — a linter that
errors on every custom class in this codebase is worse than no linter at all.

Removing it dropped three rules that were previously enforced in CI. All three
have since been replaced by `eslint-plugin-better-tailwindcss`, which does parse
v4; see `docs/adr/0003-tailwind-class-linting-and-token-aware-merging.md`.

| Rule | What it caught | Replacement |
| --- | --- | --- |
| `tailwindcss/no-custom-classname` | Class names that are neither a Tailwind utility nor a known custom class — i.e. typos in utility names | `better-tailwindcss/no-unregistered-classes`. Found three live defects on adoption. |
| `tailwindcss/classnames-order` | Class attributes not in Tailwind's canonical order | `better-tailwindcss/enforce-consistent-class-order`, plus `enforce-consistent-line-wrapping` for wrapping at the same 120 columns `style/max-len` measures. |
| `tailwindcss/enforces-shorthand` | `mt-2 mb-2` where `my-2` would do | `better-tailwindcss/enforce-shorthand-classes`. Collapsed 4 sites on adoption (`w-6 h-6` → `size-6`, `items-center justify-items-center` → `place-items-center`). |

The gap this section originally recorded is closed. It is kept because the
reasoning for the removal is still the reasoning for the replacement's choice of
plugin, and because every rule the new plugin ships is enabled, not only the
three replacements above — so the codebase also gained duplicate-class and
conflicting-class detection, deprecated-class detection, and consistency rules
for arbitrary-value and important syntax, none of which the old plugin had.

## Parity evidence: the v4-compatible prefactor (issue #2)

This commit is still on Tailwind v3. Five structurally risky edits were made in
isolation so each is proven safe before the version swap can confuse the
evidence.

**Compiled stylesheet diff.** After normalising whitespace (the diff is
otherwise swamped by an indentation shift), the generated CSS changes in exactly
three places — every one of them intended:

1. `.wallet-form .StripeElement:has(iframe)` moves from the top of the sheet to
   after the utilities. `StripeElement` is matched by exactly one selector in the
   whole sheet, so the move is inert — the assumption was checked, not trusted.
2. `.container` loses a duplicate `margin-right: auto; margin-left: auto`. The
   surviving declaration comes from `_components.css` and is emitted *after* all
   the `max-width` breakpoint steps, so centring is unchanged.
3. `@property --bg-angle` moves to the top level. Position is irrelevant for a
   registration, and there is only one.

The five `screen()` call sites produce byte-identical media queries
(`640px`/`768px`/`1024px`), and no unresolved `screen()` or `theme()` remains in
the output.

**Breakpoint behaviour**, checked live at 320/360/639/640/767/768/1023/1024/
1279/1280/1440px — these transitions cannot be seen from two screenshot
viewports:

| Value | Transition |
| --- | --- |
| `--s-header--height` | 64px → 80px exactly at 768px |
| `--font-size-caption` | 0.625rem → 0.75rem exactly at 768px |
| footer grid template | 1 → 2 columns at 640px, 2 → 3 at 768px, 3 → 4 at 1024px |

**Pixel gate.** Pixel-identical on all 22 gated shots for the run pair that
agrees (see the noise-floor caveat below).

**Lint delta.** 459 errors before, 459 after — unchanged. Exactly 10 warnings
disappear, and they are precisely the removed plugin's: 7
`tailwindcss/classnames-order` and 3 `tailwindcss/enforces-shorthand`. Nothing
new was introduced.

Note that `npm run lint` and `npm test` **were already failing before this work**
(459 lint errors; 4 failing tests in `get-subscription-redirect.test.ts`, which
also accounts for all 15 `check-types` errors). That debt is pre-existing and
untouched here — verified by re-running all three against a stashed tree.

`stylelint` reports 11 `color-hex-length` errors, all inside `src/styles/new/`,
which is the frozen Figma token pipeline and deliberately not edited.

## The version swap and theme port (issue #3)

This is the commit that actually moves to v4. What follows is the material the
diff does not explain on its own.

### Things v3 did that v4 has no direct equivalent for

**Variants on hand-written classes.** v3 generated variants for anything in the
base and component layers, so `lg:h3`, `lg:layout-desktop` and `md-max:scribble`
all worked. v4 only does that for real utilities, and a variant on a
layer-defined class compiles to *nothing at all* — no warning, no error, just a
missing rule. The affected classes were found by cross-referencing every
hand-written class name against every `variant:class` occurrence in the source:

| Class | Why it had to become `@utility` |
| --- | --- |
| `badge`, `container-wide`, `full-main`, `h1` | Composed by another rule with `@apply` — a hard build error in v4 otherwise |
| `scribble` | `md-max:scribble` |
| `h3` | `lg:h3` |
| `layout-desktop` | `lg:layout-desktop` |

`layout-desktop` is the interesting one: v3 also generated the variant for the
*other* rules mentioning the class — `body:has(.layout-desktop)`,
`.layout-desktop > *`, `.layout-desktop .s-header-nav-vertical`. Since the only
call site is `className="layout-default lg:layout-desktop"`, the unprefixed
selectors never matched anything; the prefixed ones are what did the work. The
`@utility` nests all of them, `body:has(&)` included, so the same set is
generated.

`h1` and `h3` moved out of `@layer base` into the utilities layer as a result.
`h2`/`h4`/`h5`/`h6` deliberately did not — nothing composes or varies them, and
moving them would change their cascade position for no reason. That asymmetry is
intentional.

**Two colour namespaces collapsed into one.** v3 had separate `colors`,
`backgroundColor` and `textColor` theme keys, so one name could mean two
different colours depending on the utility. v4 resolves every colour utility out
of a single `--color-*`. Three names disagreed across the v3 namespaces:

| Name | v3 `colors`/`textColor` | v3 `backgroundColor` |
| --- | --- | --- |
| `base` | — | `hsl(var(--background))` |
| `weak` | `hsl(var(--text-weak))` | `hsl(var(--fill-weak))` |
| `success` | `hsl(var(--green-transparent-800))` (text) | `hsl(var(--success))` |

A same-named `@utility` does **not** override a theme entry — it emits alongside
it and loses on source order. So all three are kept out of `@theme` entirely and
written per-utility in `_utilities.css` instead.

`base` was the one that mattered: `--color-base` also outranks `--text-base`, so
leaving it in the theme turned all ~50 `text-base` call sites from a font size
into white-on-white text. That was caught by compiling and diffing the generated
rules, not by reading the config.

v3 could also produce `border-weak`, `bg-success`, `ring-success` and similar
from these names. None has a call site, so nothing is missing from the compiled
output — but adding one now means adding it to `_utilities.css` by hand.

### Behaviour differences that are not regressions

- **`text-current` / `fill-current` now work.** v3's top-level `colors` block
  replaced Tailwind's defaults and did not include `current`, so the three call
  sites (`checkbox`, `dropdown-menu`, `alert-status`) were silently dead. v4
  builds `current` into the utility rather than the palette, so they resolve.
  This is a real, if small, rendering change — worth a look during #6.
- **v3 was extracting class names out of JavaScript.** `.visible`, `.\!visible`,
  `.filter` and `.table` were all in v3's output, produced by `const [visible,`,
  `.filter(` and `<table`. v4's extractor is stricter and drops them. No markup
  used them.
- **Unused component classes are now emitted.** v3 tree-shook hand-written
  `@layer components` rules by name; v4 emits a plain `@layer components` block
  verbatim. `container-full`, `container-ultra`, `login-button`, `s-carousel*`,
  `anchor-element`, `progress-bar-100` and `remove-animated-border` are dead CSS
  in the output now. They are dead code in the *source* too — deleting them is a
  reasonable follow-up, but not this commit's business.
- **tw-animate-css ships its own `accordion-down`/`accordion-up` keyframes.**
  Ours are imported afterwards and win. Both sets are in the output; only the
  second is used.
- `@apply` is not allowed inside `@keyframes` in v4, so `fade-in-slide-up` is
  written out longhand. It uses `translate: 0 0` rather than Tailwind's
  `--tw-translate-*` variables — a keyframe reaching into engine internals is
  what breaks on the next major.

### Parity shims

Grouped at the top of `_base.css` so the follow-up removal is one edit: v3's
default border colour, placeholder colour and button cursor.

The placeholder shim uses the literal `#9ca3af`, not the `--color-gray-400`
form the upgrade guide suggests. This palette has no `gray-400`, so under v3 the
preflight's own hardcoded fallback was what actually rendered; pointing at the
theme variable would resolve to nothing.

Ring-width and ring-colour are the two other documented preflight changes. No
shim: the bare `ring` utility appears nowhere in the codebase.

### Evidence

- Clean production build succeeds. `@property --bg-angle` survives Next's
  minifier intact, along with the 72 `@property` registrations v4 emits — the
  reason `cssnano` had to go rather than merely being redundant.
- **Build time: 28.2s on v4 against 28.8s on v3** — measured back to back, each
  from an empty `.next`, v3 built from a worktree at the previous commit with
  its own `node_modules`. No regression; the difference is inside the noise.
- **Emitted CSS grew from 91.8 KB to 107.9 KB (+17%).** Three causes, all
  understood: the untree-shaken component classes listed above, v4's 72
  `@property` registrations plus their `@supports` fallback block, and
  tw-animate-css's duplicate keyframes. Worth revisiting after #4, not before.
- Compiled stylesheet: 1,114 classes under v3, 1,115 under v4, with every
  difference accounted for above.
- No colour leakage: `bg-sky-500`, `text-slate-200`, `border-zinc-700` and
  `bg-red-500` (a shade this palette does not define) all compile to nothing,
  while `bg-green-50` and `text-strong` still resolve.
- Every `animate-*` class in use resolves, checked one by one against the
  compiled output.
- `check-types` (15), `lint` (459 errors / 12 warnings) and `vitest` (4 failed /
  7 passed) are all unchanged against the pre-existing baseline recorded above.
  `stylelint` is back to the same 11 `color-hex-length` errors in the frozen
  `src/styles/new/`, and none anywhere else.

## The utility renames (issue #4)

v4 reused several v3 class names for different values. Where that happened the
class had to move; where v4's rename only applies to *its own* default scale and
this theme overrides that scale, the v3 name already resolves to the right value
and moving it would have corrupted the design. The two sets are listed below with
the compiled declarations that justify each decision, because "apply the upgrade
tool's suggestions" is not a reviewable claim — the tool cannot see which scales
`@theme` overrides.

### Renamed, with the v3 declaration each one restores

| Was (v3) | Now (v4) | Declaration, identical on both sides |
| --- | --- | --- |
| `shadow-sm` | `shadow-xs` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` |
| `shadow` | `shadow-sm` | `0 1px 3px 0 …, 0 1px 2px -1px …` |
| `blur-sm` | `blur-xs` | `blur(4px)` — v4's `--blur-xs`, v3's literal |
| `backdrop-blur-sm` | `backdrop-blur-xs` | `blur(4px)` |
| `max-w-screen-sm` | `max-w-(--breakpoint-sm)` | `640px` |
| `max-w-screen-md` | `max-w-(--breakpoint-md)` | `768px` |
| `outline-none` | `outline-hidden` | no visible outline |
| `!mt-0`, `!text-sm`, … | `mt-0!`, `text-sm!`, … | same declarations, `!important` |

Notes on the two that are not a straight value swap:

- **`max-w-screen-*` still compiles under 4.3** (deprecated, not removed), so
  this was not a forced change — the utilities were replaced anyway because the
  acceptance criteria ask for it and because the deprecation will eventually
  bite. The `(--breakpoint-sm)` form was chosen over a literal `max-w-[640px]`
  to keep the value pointing at the same `@theme` entry v3's `screens.sm` fed,
  so a future breakpoint change still propagates. Eight call sites: six in
  `.tsx`, plus `.container-content` / `.container-medium` in `_components.css`.
- **`outline-hidden` is not declaration-identical to v3's `outline-none`.** v3
  emitted `outline: 2px solid transparent; outline-offset: 2px`; v4's
  `outline-hidden` emits `outline-style: none` plus a `forced-colors: active`
  block that restores exactly v3's transparent outline. Both render no visible
  outline, and the forced-colors path is *better* than v3's, which relied on the
  transparent outline being made visible by the OS. v4's own `outline-none` was
  not the right target: it means `outline-style: none` with no forced-colors
  fallback.

### Explicitly NOT renamed

- **`rounded-sm`** (10 call sites). v4 renamed *its* `rounded-sm` (0.125rem) to
  `rounded-xs`, but `@theme` defines `--radius-sm: calc(var(--radius) - 4px)`,
  so `rounded-sm` compiles to that same `calc()` on both sides. Renaming it
  would have silently swapped a themed radius for v4's default 0.125rem.
- **The font-size utilities** (`text-xs`, `text-sm`, `text-base`, `text-lg`).
  Same reasoning: `--text-*` is overridden in `@theme`, so `text-sm` is
  `0.875rem` on both sides. Note that `!text-sm` → `text-sm!` still applies —
  that is the important modifier moving position, not the class being renamed.
- **Bare `rounded`.** v4 kept it at `0.25rem`, identical to v3. Renaming it to
  `rounded-sm` — which the upgrade guide suggests — would have pointed it at the
  overridden `--radius-sm` and changed the value.

`checkbox.tsx` is the call site that makes a blanket find-and-replace unsafe: one
class attribute holds both `shadow` (renamed to `shadow-sm`) and `rounded-sm`
(must not move). `select.tsx` and `switch.tsx` are the same shape with
`shadow-sm` next to `text-sm` / `rounded-md`.

### Two v4 utility changes that were not on the ticket's list

Both were found by diffing the compiled sheets rather than by reading the
upgrade guide, and both are real rendering changes, so they are fixed here rather
than deferred:

1. **Bare `outline` changed width.** v3's `.outline` emitted `outline-style:
   solid` and nothing else, leaving `outline-width` at the browser default
   (`medium`, 3px everywhere in practice). v4's `.outline` adds `outline-width:
   1px`. The two `PricingCard` outlines would have thinned from 3px to 1px, so
   they are now `outline-3`.
2. **`outline-hidden` suppresses a later `outline` on the same element.** v4
   routes outline style through `--tw-outline-style`, which `outline-hidden` sets
   to `none`; `outline` and `outline-<n>` then *read* that variable. On the
   shared `inputStyle`, `focus-visible:outline-hidden` therefore killed the
   `aria-[invalid=true]:outline` red error outline whenever an invalid field was
   focused — a state v3 rendered as a 2px red outline. Fixed by making the aria
   variant `outline-solid`, which re-asserts the style. Verified in the compiled
   sheet: the `outline-solid` rule sorts after `outline-2`, so the net result is
   `solid` / `2px` / red, as on v3.

   One residual difference in that state is accepted rather than fixed: v3's
   `outline-none` also set `outline-offset: 2px`, so an invalid *and focused*
   input had a 2px-offset outline while an invalid, unfocused one had none. v4
   gives both offset 0. Restoring it would need an offset utility on the aria
   variant, which would change the unfocused case too.

### The pixel gate for #4, and what it turned up

The dev server could not be used: it had cached the v3 PostCSS pipeline at
startup and returns HTTP 500 since the dep swap, and restarting it is the
developer's call. The gate was run instead against three **production** builds
served side by side, in throwaway worktrees with their own `.next`:

| port | commit | what it is |
| --- | --- | --- |
| 3011 | `886aa61` | v3 baseline (end of #2) |
| 3013 | `2fa6804` | v4, before the renames (end of #3) |
| 3012 | `bf1eb59` | v4, after the renames (this ticket) |

Three builds rather than two, because a two-way v3-vs-now diff cannot say
whether a difference came from #3 or from #4. Two runs were captured per side;
same-code noise was 0 px on all but three shots (25 px, 57 px, 132 px), plus
`reverse-phone-lookup` at 42k–67k px, consistent with the floor measured in #2.

The gate is 24 shots — the harness's 12 routes × desktop 1440 / mobile 390 — of
which 22 are gateable (`reverse-phone-lookup` is excluded at both viewports, per
the noise measurement below). Note the harness shoots 12 routes, more than the
eight the acceptance criteria ask for. Nine of the 22 are in the table below;
here is what the other 13 did, since "not in the table" is not the same as
"clean":

- **Pixel-identical to v3, before and after** (5): `about--mobile`,
  `find-phone--mobile`, `pricing--mobile`, `privacy-policy--mobile`,
  `terms--mobile`.
- **18 px from v3, before and after** (2): `home--mobile`, `track--mobile`.
  Unchanged by this ticket and an order of magnitude under the noise floor.
- **Not diffable at all** (6): `about--desktop`, `cancellation--mobile`,
  `contact--mobile`, `find-phone--desktop`, `home--desktop`, `track--desktop`.
  The v4 page is *shorter* than the v3 page, so the two full-page captures have
  different heights and a per-pixel diff is undefined. The deltas are −6 px
  (`about--desktop`, `find-phone--desktop`, `home--desktop`, `track--desktop`),
  −8 px (`cancellation--mobile`) and −40 px (`contact--mobile`).

That last group is a real inherited difference, not a gap in the evidence. The
−8 and −40 are multiples of the 8px that `space-y-2` stops contributing on the
form pages (see below); the −6 shared by the four long pages is a separate,
smaller shortening that this ticket did not chase down. What matters for #4 is
that the heights are **identical before and after the renames** — post-#3 and
post-#4 both render 1585 / 1091 / 1967 / 4171 / 4171 / 4171 — so the shortening
is #3's in full, and the renames neither caused nor worsened it. Explaining the
−6 is #6's job, and it is listed there.

**The renames did not introduce a single pixel of divergence.** Comparing each
shot's distance from the v3 baseline before and after this ticket:

| shot | post-#3 vs v3 | post-#4 vs v3 | change |
| --- | --- | --- | --- |
| `login--desktop` | 50,667 | 49,623 | −1,044 |
| `sign-up--desktop` | 16,474 | 15,408 | −1,066 |
| `contact--desktop` | 41,157 | 40,444 | −713 |
| `login--mobile` | 38,249 | 37,481 | −768 |
| `sign-up--mobile` | 13,024 | 12,234 | −790 |
| `cancellation--desktop` | 35,317 | 35,317 | 0 |
| `pricing--desktop` | 1,340 | 1,340 | 0 |
| `terms--desktop` | 664 | 664 | 0 |
| `privacy-policy--desktop` | 332 | 332 | 0 |

Every affected shot moved *closer* to v3 or stayed put; none moved away. All four
v3-run × v4-run pairings agree on these numbers, so they are signal, not noise.

**The residual divergence is a pre-existing #3 regression, diagnosed here but
not fixed here** — it is not a utility rename, so it is out of this ticket's
scope. It is written up rather than left for the screenshots to re-discover:

> `space-y-*` no longer applies when the earlier sibling is inline. v3 emitted
> `.space-y-2 > :not([hidden]) ~ :not([hidden]) { margin-top: … }`, putting the
> margin on the *later* sibling. v4 emits
> `:where(.space-y-2 > :not(:last-child)) { margin-block-end: … }`, putting it on
> the *earlier* one. In every affected form the earlier sibling is a `<label>`,
> which is `display: inline` — and vertical margins have no effect on a
> non-replaced inline box. Measured on `/login`: the `.space-y-2` wrapper is 82px
> tall on v3 and 74px on v4; the label's `margin-block-end` is a live `8px` in
> both, it simply does nothing. The 8px loss per field compounds down the page,
> which is the whole of the 35k–50k px diff on the four form pages.
>
> There are 22 `space-y-*` call sites across 17 files. The fix is either to give
> `Label` a `block` display or to move those wrappers to `flex flex-col gap-*`;
> that is a judgement call about the component, so it belongs to #6.

A second, much smaller inherited shortening is left for #6 as well: `about`,
`find-phone`, `home` and `track` each render **6px shorter** on v4 at the desktop
viewport (1591→1585 and 4177→4171), which is what makes those four shots
undiffable. It is not the `space-y` bug — 6 is not a multiple of the 8px above —
and it does not appear at the mobile viewport or on the other desktop pages. Like
the `space-y` regression it is identical before and after the renames, so it
predates this ticket; it has not been root-caused.

One near-miss worth recording, because it would mislead the next person to probe
this: **v4 added `outline-color` to `transition-colors`** (v3's list was `color`,
`background-color`, `border-color`, `text-decoration-color`, `fill`, `stroke`).
Reading `outlineColor` immediately after toggling `aria-invalid` therefore
catches the value mid-animation and reports near-black, which looks exactly like
a broken colour token. Once the transition settles, all three builds agree on
`rgba(199, 56, 56, 0.8)`. The colour is fine; only the instant-vs-animated
behaviour changed.

### Evidence

- Every renamed utility's compiled declarations were read out of both sheets and
  matched by hand; the table above is that comparison.
- `outline-3` and the `outline-solid` fix were verified by reading computed
  styles out of the running builds, not by pixels: the `PricingCard` outlines are
  `solid` / `3px` / same colour / `-1px` offset on both v3 and post-#4, and they
  live on `reverse-phone-lookup`, the one page the pixel gate cannot judge. The
  invalid-input outline goes `solid 2px red` on v3 → `none 0px` on post-#3 → back
  to `solid 2px red` on post-#4.
- Diffing the compiled sheet before and after the renames yields 122 changed
  lines, all of them accounted for by the table plus the two fixes above. The
  only residual is `.focus\:filter-none:focus` and `.backdrop-blur-xl` shifting
  position in the sheet, a source-order effect of the renamed classes sorting
  differently. Neither shares a property with its new neighbours.
- Class-name sweeps confirm the criteria: no `outline-none`, no
  `max-w-screen-*`, and no important modifier in prefix position remains in
  `src`; `rounded-sm` is at all 10 of its original call sites and the font-size
  utilities are untouched apart from the two that changed modifier position.
- `check-types` (15), `lint` (459 errors / 12 warnings), `vitest` (4 failed /
  7 passed) and `stylelint` (11, all in the frozen `src/styles/new/`) are all
  unchanged against the baseline. One transient new `style/max-len` error, from
  `outline-hidden` being two characters longer than `outline-none`, was fixed by
  splitting the class list in `results-content.tsx`.

## Verification seams

Verification does not rely on the unit test suite, which runs in a DOM
simulation that never loads the stylesheet and is therefore blind to styling.
Two purpose-built seams are used instead:

1. **Compiled stylesheet diff** — `src/styles/application.css` compiled through
   the project's own PostCSS config, unminified, before and after. Total
   coverage of generated utilities, including those only used on unreachable
   pages. Requires a human to read; a coverage backstop, not a gate.
2. **Rendered-application pixel diff** — full-page screenshots of the reachable
   public pages at desktop (1440px) and mobile (390px), pixel-compared before
   and after. This is the primary pass/fail gate.

The harness for both is throwaway migration tooling and is not committed.

### Measured screenshot noise floor

The floor was measured, not assumed: 12 pages × 2 viewports were captured four
times — twice before any change and twice after — so that same-code pairs and
across-change pairs could be compared against each other.

Between runs of **identical code** the observed differences were:

- Most shots pixel-identical.
- A tail of shots differing by 4–61 pixels (≤0.008%), all anti-aliased text edges.
- `find-phone--desktop` differing by **1,365 pixels** (0.023%) between the two
  post-change runs — scattered 1–3 pixels per row across 445 rows of a
  4,177-pixel-tall page, with no change in image dimensions. This is text
  rasterisation variance, not layout.
- `reverse-phone-lookup` differing by 43,000–70,000 pixels at both viewports.

Two conclusions a reviewer should take from this:

1. **A single-pair pixel diff is not trustworthy on this app.** A per-page
   numeric threshold would have to be set at ~1,400 pixels to avoid false
   alarms, which is too coarse to catch a real regression. The reliable signal
   is instead *cross-run agreement*: capture more than one run per side and look
   for a pair that agrees.
2. **`reverse-phone-lookup` is not gateable.** Its content is genuinely
   non-deterministic between loads. It is excluded from the pixel gate and must
   be checked by hand.

### Coverage gaps for manual checking

The pixel gate reaches 12 public pages. Not covered, and needing manual checks:

- `reverse-phone-lookup` — non-deterministic, excluded from the gate (above).
- `/l/[id]` and `/search-complete` — both use the bare `.container` class, and
  neither is reachable without state. `/contact` also uses `.container` and *is*
  gated, so the class itself is covered; these two pages are only uncovered for
  their own additional styling.
- `/checkout`, `/search`, `/success`, `/thank-you` — redirect away without
  funnel state.
- The whole member area — requires authentication.

## Sign-off (issue #6)

Both seams re-run end to end against the pre-migration baseline. This section is
the evidence; the reviewer-facing summary is in `tailwind-v4-merge-request.md`
and the human QA list is in `tailwind-v4-manual-checklist.md`.

### How the two builds were obtained

The development server cannot be used for this: it caches the PostCSS pipeline
at startup, so after the dependency swap it returns HTTP 500 until the developer
restarts it, and only the developer owns that process. Both sides were therefore
built and served as **production builds from throwaway git worktrees**:

- v3 — worktree at `886aa61` (the last commit before the swap) with its own
  `npm install`, served on `:3031`.
- v4 — worktree at the migration HEAD, served on `:3041`.

Each side was captured **twice**, so a same-code pair and an across-change pair
could be compared against each other. That matters here: see the noise floor
section above.

### Seam 2 — the pixel gate

Same-code noise on production builds is far lower than the development-server
figures recorded earlier:

| pairing              | shots differing | worst                       |
| -------------------- | --------------- | --------------------------- |
| v3 run 1 vs v3 run 2 | 1 of 22 gated   | 132 px (`pricing--desktop`) |
| v4 run 1 vs v4 run 2 | 0 of 22 gated   | 0 px                        |

Across the change, 24 shots (12 pages × 2 viewports):

- **17 shots pixel-identical**, including every form page. Both `login` shots,
  both `sign-up` shots, `contact` and `cancellation` at both viewports went from
  12,000–50,000 differing pixels to **zero** once the two regressions below were
  fixed.
- **4 shots** — `about`, `find-phone`, `home`, `track` at desktop — 6 pixels
  shorter. Fully accounted for: see "The `leading-*` change" below.
- **1 shot** — `pricing--desktop`, 876 pixels. See "The zero-width outline"
  below.
- **2 shots excluded** — `reverse-phone-lookup`, which differs by 45,000–59,000
  pixels between two runs of _identical_ code and is not gateable at all. It is
  on the manual checklist.

### Two regressions found and fixed

Both were introduced by the version swap (#3), not by the renames (#4) — proven
by capturing three points (v3, pre-rename v4, post-rename v4) rather than two.

**1. `space-y-*` collapsed on every form.** v3 put the gap on the _later_
sibling (`> :not([hidden]) ~ :not([hidden]) { margin-top }`); v4 puts it on the
_earlier_ one (`:where(& > :not(:last-child)) { margin-block-end }`). Every
`FormItem` is a `space-y-2` wrapper whose earlier sibling is a Radix `Label`,
which is `display: inline` — and vertical margins do nothing on an inline box.
Measured on `/login`: the wrapper was 82px on v3 and 74px on v4, with the
label's `margin-block-end` a live 8px doing nothing.

Fixed in `src/components/ui/label.tsx` by making the label `inline-block`. Three
candidates were measured in the live page (`block`, `inline-block`, `flex`); all
three restore the wrapper to 82px, and `inline-block` was chosen because it also
keeps the label's shrink-to-fit width, so the click target is unchanged too.
`Label` has exactly one consumer (`FormLabel`), so the blast radius is the forms
and nothing else. Rewriting the wrappers as `flex flex-col gap-*` is what the
upgrade guide suggests, and is explicitly out of scope for this migration.

**2. `ring-offset-*` became self-activating.** v3's `ring-offset-2` set only
`--tw-ring-offset-width`; the offset shadow was composited by the `ring-*`
utilities, so on its own the class was inert. v4's `ring-offset-2` also sets
`--tw-ring-offset-shadow`, which any `shadow-*` utility composites — so every
button carrying a shadow painted a permanent 2px white ring that clipped its own
drop shadow. Visible on the header "Log In" button on every page, and on the
pricing CTAs.

Fixed in `src/components/ui/button.tsx` by scoping it to `focus-visible:`, the
variant that turns the ring on. That reproduces v3 exactly: nothing at rest, a
2px offset on focus. The codebase's other `ring-offset-*` usages were checked
and are unaffected — they are either already variant-scoped, or set only
`--tw-ring-offset-color` (`ring-offset-background`), or sit on an element with
no `shadow-*` to composite into (`credit-card-form.tsx`, where the class is dead
under both versions).

### The `leading-*` change — accepted, needs a reviewer decision

The 6-pixel shortening on four desktop pages is entirely this, and nothing else:
the DOM was compared element-by-element between the two builds, and on `/about`
and `/home` the _only_ non-margin property that differs anywhere on the page is
`lineHeight` on the `h3`s of the "why choose" cards, 27px → 24px.

The markup is `text-base font-semibold leading-6 lg:text-lg`. In v3 the
font-size utility carried its own `line-height`, and `.lg\:text-lg` was emitted
inside a media query at the very end of the sheet, so at ≥1024px it beat the
earlier `.leading-6` and the line-height became 1.5 × 18px = 27px. In v4 the
font-size utility emits `line-height: var(--tw-leading, …)`, so an explicit
`leading-*` wins regardless of order — 24px.

This is v4 honouring what the author wrote, which puts it in the same category
as the three behaviour changes accepted at the start of the migration, so it is
**accepted and reported rather than silently reverted** — restoring v3 would
mean adding a responsive leading override that nobody would write deliberately.
It is called out because it is a real (if small) visual change that was not on
the original list.

Affected sites, and the one-line reversal if the reviewer prefers v3's rendering:

| Site                               | Class list                           | v3   | v4   | To restore v3                              |
| ---------------------------------- | ------------------------------------ | ---- | ---- | ------------------------------------------ |
| `homepage/whyChoose.tsx:60`        | `text-base … leading-6 … lg:text-lg` | 27px | 24px | add `lg:leading-[1.5]`                     |
| `about/page.tsx:33`                | same                                 | 27px | 24px | add `lg:leading-[1.5]`                     |
| `_components/recentLookups.tsx:42` | `leading-6 … lg:text-base`           | 24px | 24px | no change — `text-base` is also 1.5 × 16px |
| `homepage/instantLocator.tsx:20`   | `lg:text-2xl lg:leading-7`           | —    | —    | no change — measured identical in both     |

### The zero-width outline — accepted

`pricing--desktop` is the one gated shot with a non-zero pixel count: **876
pixels, every one an anti-aliased edge of the two phone-input placeholders, and
every one differing by exactly one level in one or two channels** (111 distinct
colour pairs, all ±1). For scale, that same shot moves by 132 pixels with a
maximum channel delta of **14** between two runs of identical v3 code.

The cause is `.phone-input-input`'s `@apply outline-0`. v3 emitted
`outline-width: 0px` alone; v4 also emits `outline-style: var(--tw-outline-style)`,
which resolves to `solid`. A zero-width outline paints nothing — every other
computed property on the element is byte-identical between the builds, and the
placeholder's own colour, font and metrics are identical — but it is enough to
shift Chrome's text rasterisation by one level. Not shimmed: the declaration is
correct, and a one-level difference on anti-aliased glyph edges is below the
threshold at which anything is distinguishable.

### Seam 1 — the two claims the ticket asked to prove

Both were assumed when the approach was chosen. Both are now measured rather
than argued, using a static page that loads the v3 compiled sheet and then the
v4 compiled sheet and diffs computed styles.

**Cascade-layer precedence of the promoted classes is unchanged.** Every string
literal in `src/` that mentions `badge`, `container-wide`, `full-main`, `h1`,
`h3`, `scribble` or `layout-desktop` was collected — 41 distinct class strings —
and each was rendered on a `div`, an `h1` and an `h3` (the tag matters, because
`h1 { @apply h1 }` stays in the base layer while `.h1` moved to utilities). Of
**124 probes, 3 differ**, and all three are the same thing: `rounded-full` on
`.badge`, which is `9999px` under v3 and `calc(infinity * 1px)` under v4.
Rendered at 240×240, 200×48, 560×560, 24×24 and 1000×3, the two values produce
**0 differing pixels** — CSS clamps `border-radius` to half the box, so any
value past that is the same pill.

So promotion into the utilities layer changed the precedence of nothing that
this codebase actually writes.

**The relocated payment-form styling is inert.** `_custom.css` moved from before
the base layer to after it, and in v4 it is unlayered, which beats every layered
rule regardless of order. It contains one rule,
`.wallet-form .StripeElement:has(iframe) { padding-top: 2px }`. Both compiled
sheets contain exactly **two** mentions of `.wallet-form`/`.StripeElement` — the
one rule, with nothing to compete with it. Rendered under both sheets, a
`.StripeElement` with an iframe computes `padding-top: 2px`, one without
computes `0px`, and one outside `.wallet-form` computes `0px`. Identical.

### The unreachable features, measured

The nine styling features on pages the pixel gate cannot reach were put through
the same static comparison — 20 classes covering all nine, every computed
property on the element and its `::before`, under both sheets, with animations
frozen so running keyframes are not sampled at different moments.

**12 are byte-identical. The other 8 differ in exactly one value** — the same
`rounded-full` `9999px` → `calc(infinity * 1px)` as above, on the five badge
variants, `.search-located-bg`, `.globe` and `.globe-map`. Nothing else differs
on any of the twenty: filtering the probe output for non-`border-radius` lines
returns nothing. That value renders pixel-identically (see above), so no
declaration changed. What is left for a human is composition in real markup and
live animation, which is what the manual checklist asks for.

### Everything else

- `check-types`: 15 errors, all in `src/hooks/get-subscription-redirect.test.ts`
  — unchanged against the pre-existing baseline.
- `lint`: 471 problems (459 errors, 12 warnings) — unchanged.
- `vitest`: 4 failed / 7 passed, same file — unchanged.
- `stylelint`: 11 `color-hex-length` errors, all in the frozen `src/styles/new/`
  — unchanged.
- No harness file is committed: everything lives under `.tmp/`, which is
  gitignored.
