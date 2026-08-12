# Tailwind v4 migration — reviewer notes

Notes accumulated by the commits that make up the Tailwind v3 → v4 migration
(issue #1). Each section is material a reviewer needs that the diff does not
show on its own. The final sign-off report is issue #6.

## Lost tooling coverage

### Tailwind ESLint rules (removed in the v4-compatible prefactor, issue #2)

`eslint-plugin-tailwindcss` was **removed rather than upgraded**. It cannot parse
Tailwind v4, and its v4-compatible line is still pre-release — a linter that
errors on every custom class in this codebase is worse than no linter at all.

Removing it drops three rules that were previously enforced in CI:

| Rule | What it caught | Replacement |
| --- | --- | --- |
| `tailwindcss/no-custom-classname` | Class names that are neither a Tailwind utility nor a known custom class — i.e. typos in utility names | None. Typos now fail silently at runtime. |
| `tailwindcss/classnames-order` | Class attributes not in Tailwind's canonical order | None. A class-sorting formatter plugin is a reasonable follow-up (out of scope for this migration). |
| `tailwindcss/enforces-shorthand` | `mt-2 mb-2` where `my-2` would do | None. |

This loss is intentional and accepted for the duration of the migration. It is
recorded here so the team can decide whether to replace any of it rather than
discovering the gap later.

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
