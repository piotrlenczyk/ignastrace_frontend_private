import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import antfu from '@antfu/eslint-config';
import nextPlugin from '@next/eslint-plugin-next';
import betterTailwindcss from 'eslint-plugin-better-tailwindcss';
import jestDom from 'eslint-plugin-jest-dom';
import jsxA11y from 'eslint-plugin-jsx-a11y';
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
const LEGACY_THEME_PATH = fileURLToPath(
  new URL('./src/styles/_theme-legacy.css', import.meta.url),
);

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
 * no-unregistered-classes at the end either — core supplies them once the theme
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
 * surviving old class is an unregistered one, and that rule is already on.
 */
function legacyClassRestrictions() {
  if (!existsSync(LEGACY_THEME_PATH)) {
    return [];
  }

  const names = [
    ...readFileSync(LEGACY_THEME_PATH, 'utf8').matchAll(/^\s*--color-([a-z0-9-]+):/gm),
  ].map(([, name]) => name);

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

export default antfu(
  {
    react: true,
    typescript: true,

    lessOpinionated: true,
    isInEditor: false,

    stylistic: {
      semi: true,
    },

    formatters: {
      css: false,
    },

    ignores: [
      'migrations/**/*',
      'next-env.d.ts',
      'src/locales/**/*',
      // 'src/components/ui/**/*',
      'package.json',
    ],
  },
  jsxA11y.flatConfigs.recommended,
  {
    files: ['**/*.?([cm])[jt]s?(x)'],
    plugins: {
      'better-tailwindcss': betterTailwindcss,
    },
    settings: {
      'better-tailwindcss': {
        // Load-bearing. There is no tailwind.config.ts — the theme is declared
        // in CSS — so this is the only way the plugin can learn which classes
        // exist. If it stops resolving, no-unregistered-classes goes quiet
        // rather than failing. See docs/adr/0003-*.md.
        entryPoint: TAILWIND_ENTRY_POINT,
      },
    },
    rules: {
      /*
       * Every rule the plugin ships, all at error. A warning on a codebase that
       * already carries a lint backlog reads the same as a disabled rule.
       * `no-restricted-classes` is inert until given a list; it is enabled so
       * that adding one is a one-line change rather than a decision.
       */
      'better-tailwindcss/enforce-consistent-class-order': 'error',
      'better-tailwindcss/enforce-consistent-important-position': 'error',
      'better-tailwindcss/enforce-consistent-variable-syntax': 'error',
      'better-tailwindcss/enforce-shorthand-classes': 'error',
      'better-tailwindcss/no-deprecated-classes': 'error',
      'better-tailwindcss/no-restricted-classes': 'error',
      'better-tailwindcss/no-unnecessary-whitespace': 'error',
      'better-tailwindcss/enforce-consistent-line-wrapping': [
        'error',
        {
          /*
           * Wrap only when the attribute would otherwise breach max-len, and
           * match its 120. The rule's own default breaks a class list onto one
           * line per variant regardless of length, which would rewrite every
           * short static attribute in the codebase for no reading benefit.
           */
          group: 'newLine',
          preferSingleLine: true,
          printWidth: 120,
        },
      ],
      'better-tailwindcss/no-conflicting-classes': 'error',
      'better-tailwindcss/no-duplicate-classes': 'error',
      'better-tailwindcss/no-unregistered-classes': [
        'error',
        { ignore: HAND_WRITTEN_CLASSES.map(name => `^${name}$`) },
      ],
    },
  },
  /*
   * The ratchet, scoped to what has already been redesigned. Spread out of an
   * array so that an empty MIGRATED_PATHS contributes no config object at all —
   * a block with `files: []` would be a config that silently matches nothing,
   * which reads the same as a rule that is not working.
   */
  ...(MIGRATED_PATHS.length > 0
    ? [{
        files: MIGRATED_PATHS,
        plugins: {
          'better-tailwindcss': betterTailwindcss,
        },
        settings: {
          'better-tailwindcss': {
            entryPoint: TAILWIND_ENTRY_POINT,
          },
        },
        rules: {
          'better-tailwindcss/no-restricted-classes': [
            'error',
            { restrict: legacyClassRestrictions() },
          ],
        },
      }]
    : []),
  {
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
  {
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
    files: ['**/*.spec.ts', '**/*.e2e.ts'],
  },
  {
    rules: {
      'import/order': 'off',
      'sort-imports': 'off',
      'style/brace-style': ['error', '1tbs'],
      'ts/consistent-type-definitions': ['error', 'type'],
      'react/prefer-destructuring-assignment': 'off',
      'node/prefer-global/process': 'off',
      'test/padding-around-all': 'error',
      'test/prefer-lowercase-title': 'off',
      'eol-last': ['error', 'always'],
    },
  },
  {
    files: ['**/*.md', '**/*.mdx'],
    rules: {
      'style/max-len': 'off', // Disable max-len for markdown files
    },
  },
);
