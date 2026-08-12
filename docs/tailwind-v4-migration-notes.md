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
