import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import betterTailwindcss from 'eslint-plugin-better-tailwindcss';
import jestDom from 'eslint-plugin-jest-dom';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import testingLibrary from 'eslint-plugin-testing-library';

/*
 * Hand-written classes that are not Tailwind utilities and never will be: page
 * structure, component hooks and the heading scale, all defined by hand in
 * src/styles. The plugin can only see classes Tailwind itself compiles, so
 * without this list every one of them reads as a typo.
 *
 * Listed exactly rather than by prefix on purpose — `^s-` would also wave
 * through `s-heder`, and catching that is the reason the rule is here at all.
 * A class deleted from the stylesheet should be deleted from this list too.
 */
const HAND_WRITTEN_CLASSES = [
  'destructive',
  'success',
  'phone-input-flag-wrapper',
  's-carousel-pager-item',
  'badge-active',
  'badge-canceled',
  'badge-expired',
  'brand-icon',
  'brand-icon-primary-weak',
  'brand-icon-secondary-weak',
  'brand-icon-strong',
  'caller-info-card',
  'container-content',
  'container-medium',
  'container-small',
  'content-html',
  'dialog-products',
  'display',
  'display-mini',
  'funnel-container',
  'funnel-container-located',
  'globe',
  'globe-map',
  'h2',
  'h4',
  'h5',
  'h6',
  'input-animated-border',
  'input-animated-border-secondary',
  'layout-default',
  'link',
  'order-table',
  'phone-input',
  'phone-input-form',
  'phone-input-input',
  'progress-bar',
  'progress-bar-30',
  'progress-bar-60',
  's-footer',
  's-footer-container',
  's-header',
  's-header-nav',
  's-header-nav-vertical',
  's-main',
  's-mobile-menu-content',
  's-mobile-menu-content-links',
  'search-circle',
  'search-located-bg',
  'search-radar',
  'separator',
  'span-green',
];

/*
 * The stylesheet the class linter resolves the legal class set from. Named once
 * because ADR 0003 calls it load-bearing — if it stops resolving the rules go
 * quiet rather than failing — and a value like that should not be spelled out
 * in two places where only one of them can be updated.
 */
const TAILWIND_ENTRY_POINT = 'src/styles/application.css';

/*
 * ── the redesign ratchet ────────────────────────────────────────────────────
 * Pages are being rebuilt against the Figma design one at a time, and the old
 * palette and type scale are deleted once the last one lands. Until then both
 * vocabularies compile side by side, so nothing on its own stops a freshly
 * redesigned page from reaching for a token that is on its way out. This does —
 * but only inside directories that have already been redesigned, since
 * everywhere else the old names are still the only ones the page is written in.
 *
 * See docs/adr/0005-two-colour-systems-during-the-redesign.md.
 *
 * The path is resolved against this file rather than the working directory. A
 * relative one would read as correct and behave correctly from the repository
 * root, then quietly find nothing when ESLint is invoked from anywhere else —
 * and finding nothing here does not fail, it restricts nothing. That is the
 * silent no-op ADR 0003 records for the entry point above, and it is worse for
 * a rule whose entire job is to notice things.
 */
const LEGACY_THEME_PATH = fileURLToPath(new URL('./src/styles/_theme-legacy.css', import.meta.url));

/*
 * Directories rebuilt against the Figma design: one entry per route as it
 * lands, together with that route's page-specific components. Until the first
 * one is added the block below contributes nothing, which is the intended
 * resting state and not an oversight.
 *
 * src/components/ui is deliberately absent. The shared components keep the old
 * palette until they are redesigned in their own right, and a redesigned page
 * importing one of them is not an error — the restriction is per file, so it
 * has nothing to say about what a file imports.
 */
/** @type {string[]} */
const MIGRATED_PATHS = [];

/*
 * Utility prefixes that resolve out of the `--color-*` namespace. Enumerated
 * rather than matched loosely, because the two vocabularies are only a hyphen
 * apart: `text-body` is retiring and `font-body` is its replacement, so a
 * pattern broad enough to catch the first catches the second too. The
 * directional border and divide suffixes are spelled out for the same reason —
 * a lazier `border-[a-z]+` reads the new `border-border-primary` as the
 * retiring `border` followed by a `primary` suffix, and reports it.
 */
const COLOUR_UTILITY_PREFIXES = [
  'bg',
  'text',
  'decoration',
  'border',
  'border-[xysetrbl]',
  'divide',
  'divide-[xy]',
  'outline',
  'ring',
  'ring-offset',
  'inset-ring',
  'shadow',
  'inset-shadow',
  'accent',
  'caret',
  'fill',
  'stroke',
  'placeholder',
  'from',
  'via',
  'to',
].join('|');

/*
 * The five sizes that retire alongside the palette. These have to be listed by
 * hand, unlike the colour names: `text-base`, `text-lg`, `text-sm` and
 * `text-xs` are also Tailwind's own defaults, so they cannot be read off the
 * file that is being deleted. That same fact is why they will not be caught by
 * no-unknown-classes at the end either — core supplies them once the theme
 * stops overriding them, and the only visible effect is that line height
 * quietly changes. Here is the one place they are guarded.
 */
const LEGACY_TEXT_SIZES = ['base', 'lg', 'sm', 'xs', 'caption'];

/*
 * The rule matches against the class exactly as it is written, so the patterns
 * have to account for everything that may be attached to a utility rather than
 * only its bare name.
 *
 * In front: any number of variants, each ending in a colon, and the leading
 * form of the important marker. Expressed as a negative lookbehind so that the
 * reported class name is the utility itself and not the separator before it.
 *
 * Behind: an optional modifier — the opacity or line-height shorthand, as in
 * `bg-primary/50` or `text-sm/6` — and then the trailing important marker.
 * `text-sm!` and `text-base!` are both already in use here, and an anchor that
 * stops at the name silently lets every one of them through.
 */
const CLASS_START = '(?<![^:!])';
const CLASS_END = '(?:\\/[\\w.[\\]-]+)?!?$';

/*
 * Read the retiring colour names out of the stylesheet rather than restating
 * them here. A hundred-odd names copied into a config file is a list that
 * drifts, with nothing to notice when it does — and ADR 0004 already turned
 * down a hand-maintained token bridge on exactly that ground. Deriving them
 * means a token dropped from the theme stops being reported in the same commit
 * that drops it.
 *
 * Once _theme-legacy.css is deleted this yields nothing and the rule falls
 * silent, which is correct rather than a gap: with the theme gone, every
 * surviving old class is an unknown one, and that rule is already on.
 */
function legacyClassRestrictions() {
  if (!existsSync(LEGACY_THEME_PATH)) {
    return [];
  }

  const names = [...readFileSync(LEGACY_THEME_PATH, 'utf8').matchAll(/^\s*--color-([a-z0-9-]+):/gm)].map(
    ([, name]) => name,
  );

  if (names.length === 0) {
    return [];
  }

  return [
    {
      message: '"$0" is from the retiring palette. Use an intent token from src/styles/new/semantics.css.',
      pattern: `${CLASS_START}(?:${COLOUR_UTILITY_PREFIXES})-(?:${names.join('|')})${CLASS_END}`,
    },
    {
      message: '"$0" is from the retiring type scale. Use a named text style from src/styles/new/typo.css.',
      pattern: `${CLASS_START}text-(?:${LEGACY_TEXT_SIZES.join('|')})${CLASS_END}`,
    },
  ];
}

/*
 * Shared by the block below and by the ratchet. Both need the plugin registered
 * and both need the entry point, and a ratchet block that registered the plugin
 * without it would resolve no classes at all — quietly, per ADR 0003.
 */
const tailwindPlugin = {
  plugins: {
    'better-tailwindcss': betterTailwindcss,
  },
  settings: {
    'better-tailwindcss': {
      // Load-bearing. There is no tailwind.config.ts — the theme is declared
      // in CSS — so this is the only way the plugin can learn which classes
      // exist. If it stops resolving, no-unknown-classes goes quiet rather
      // than failing. See docs/adr/0003-*.md.
      entryPoint: TAILWIND_ENTRY_POINT,
    },
  },
};

/*
 * The ratchet, scoped to what has already been redesigned. Returns an array so
 * that an empty path list contributes no config object at all — a block with
 * `files: []` would be a config that silently matches nothing, which reads the
 * same as a rule that is not working.
 *
 * Exported because eslint.config.test.mts points it at a fixture path. The test
 * exercises this exact object, so a rule renamed, an option reshaped or the
 * plugin left unregistered fails the suite rather than going quiet.
 */
/**
 * @param {string[]} paths
 * @returns {import('eslint').Linter.Config[]}
 */
export function ratchetConfig(paths) {
  if (paths.length === 0) {
    return [];
  }

  return [
    {
      files: paths,
      ...tailwindPlugin,
      rules: {
        'better-tailwindcss/no-restricted-classes': ['error', { restrict: legacyClassRestrictions() }],
      },
    },
  ];
}

/** @type {import('eslint').Linter.Config[]} */
const config = [
  {
    /*
     * `migrations/**` used to be listed here and that directory does not exist.
     * An ignore rule matching nothing is exactly the silent no-op ADR 0003
     * warns about, so it is gone. Locale files are Lokalise's; the rest is
     * generated.
     */
    ignores: ['.next/**', 'coverage/**', 'next-env.d.ts', 'node_modules/**', 'out/**', 'src/locales/**'],
  },

  /*
   * Next's own supported configuration, in the combination that covers what
   * @antfu/eslint-config used to supply: Next's rules, React, React Hooks, JSX
   * a11y (via core-web-vitals) and typescript-eslint's recommended set (via
   * next/typescript). Type-aware linting stays off — it would add a large
   * backlog across 540 files and slow every run.
   */
  ...nextCoreWebVitals,
  ...nextTypescript,

  {
    files: ['**/*.?([cm])[jt]s?(x)'],
    ...tailwindPlugin,
    rules: {
      /*
       * The rule set as it stood under v3, all at error. A warning on a
       * codebase that already carries a lint backlog reads the same as a
       * disabled rule. `no-restricted-classes` is inert until given a list; it
       * is enabled so that adding one is a one-line change rather than a
       * decision.
       *
       * v4 renamed `no-unregistered-classes` to `no-unknown-classes`; that is a
       * spelling change and it is followed below.
       *
       * v4 also *added* four rules, and they stay off for now:
       * `enforce-logical-properties` rewrites every `mb-`/`ml-` in the codebase
       * to its logical equivalent, `enforce-canonical-classes` and
       * `enforce-consistent-variant-order` rewrite class names and variant
       * order, and `no-concatenated-classes` reports a pattern nothing has
       * decided about yet. Each is a change to how the codebase is written
       * rather than a port of what it already enforced, and belongs to whoever
       * wants that change — not to a toolchain migration. See
       * docs/adr/0006-*.md.
       */
      'better-tailwindcss/enforce-consistent-class-order': 'error',
      'better-tailwindcss/enforce-consistent-important-position': 'error',
      'better-tailwindcss/enforce-consistent-variable-syntax': 'error',
      'better-tailwindcss/enforce-shorthand-classes': 'error',
      'better-tailwindcss/no-conflicting-classes': 'error',
      'better-tailwindcss/no-deprecated-classes': 'error',
      'better-tailwindcss/no-duplicate-classes': 'error',
      'better-tailwindcss/no-restricted-classes': 'error',
      'better-tailwindcss/no-unnecessary-whitespace': 'error',
      'better-tailwindcss/enforce-consistent-line-wrapping': [
        'error',
        {
          /*
           * Wrap only when the attribute would otherwise breach the print
           * width, and match Prettier's 120 so the two tools break a long
           * className at the same column. The rule's own default breaks a class
           * list onto one line per variant regardless of length, which would
           * rewrite every short static attribute in the codebase for no reading
           * benefit.
           */
          group: 'newLine',
          preferSingleLine: true,
          printWidth: 120,
        },
      ],
      'better-tailwindcss/no-unknown-classes': ['error', { ignore: HAND_WRITTEN_CLASSES.map((name) => `^${name}$`) }],
    },
  },

  ...ratchetConfig(MIGRATED_PATHS),

  {
    /*
     * config-next supplies the import plugin but turns no sorting on, and the
     * import order in this codebase is the one antfu's config produced.
     */
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },

  {
    files: ['**/*.test.ts?(x)'],
    ...testingLibrary.configs['flat/react'],
    ...jestDom.configs['flat/recommended'],
  },

  {
    /*
     * A class list inside a test is a fixture, not markup. `cn`'s tests assert
     * what tailwind-merge does with a *particular* input order, and the class
     * order fixer will happily rewrite the input — turning a passing assertion
     * into a failing one, or worse, a meaningless one that still passes.
     */
    files: ['**/*.test.ts?(x)'],
    rules: {
      'better-tailwindcss/enforce-consistent-class-order': 'off',
      'better-tailwindcss/enforce-shorthand-classes': 'off',
      'better-tailwindcss/no-conflicting-classes': 'off',
      'better-tailwindcss/no-duplicate-classes': 'off',
      'better-tailwindcss/no-unknown-classes': 'off',
    },
  },

  {
    rules: {
      /*
       * The whole codebase is written with `type`, and without this the
       * convention decays silently one `interface` at a time. Module
       * augmentation is the exception and says so at each site — only
       * interfaces merge, and merging is the point.
       */
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],

      /*
       * Both of these were errors on arrival and are demoted rather than
       * satisfied. The reasons are recorded in
       * docs/adr/0006-lint-and-format-without-antfu.md; the short version:
       *
       * no-explicit-any — 59 sites, all inherited. Typing them properly is a
       * typing project with its own review, not a side effect of changing lint
       * configuration, and silencing them one directive at a time would leave
       * no trace of how many there were.
       */
      '@typescript-eslint/no-explicit-any': 'warn',

      /*
       * A leading underscore is the conventional way of saying "this binding
       * exists for its position, not for its value" — a skipped destructured
       * field, an argument a signature forces on a handler, a caught error
       * nothing reads. Only the ignore patterns are added here; the severity
       * stays the `warn` Next's config already set, so restating the options
       * does not turn the existing backlog into a gate.
       */
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_',
        },
      ],
    },
  },

  {
    /*
     * react-hooks 7 ships the React Compiler's analyses as lint rules. They
     * find real things, but every fix is a change to how a component behaves,
     * and React Compiler is deliberately not enabled here — so on this codebase
     * they are advice, not a gate. `rules-of-hooks` stays an error: it caught
     * three plain server functions wearing a `use` prefix, and that was a
     * genuine bug waiting to happen.
     */
    rules: {
      'react-hooks/purity': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/static-components': 'warn',
    },
  },

  {
    /*
     * package.json declares no `type`, so the config files at the root are
     * CommonJS and have to be.
     */
    files: ['*.js', '.*.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  {
    /*
     * Module augmentation, and only interfaces merge — a `type` here is a
     * duplicate identifier, not a style choice. Stated as an override rather
     * than as inline directives because the `consistent-type-definitions`
     * fixer rewrites the declaration and drops the directive in the same pass.
     */
    files: ['global.ts', 'src/auth.ts'],
    rules: {
      '@typescript-eslint/consistent-type-definitions': 'off',
    },
  },
];

export default config;
