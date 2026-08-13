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
        entryPoint: 'src/styles/application.css',
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
          group: 'never',
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
