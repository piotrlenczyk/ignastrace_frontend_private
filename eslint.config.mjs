import antfu from '@antfu/eslint-config';
import nextPlugin from '@next/eslint-plugin-next';
import jestDom from 'eslint-plugin-jest-dom';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import testingLibrary from 'eslint-plugin-testing-library';

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
      'src/components/ui/**/*',
      'package.json',
    ],
  },
  // eslint-plugin-tailwindcss is deliberately absent: it cannot parse Tailwind v4
  // and its v4-compatible line is still pre-release. See
  // docs/tailwind-v4-migration-notes.md for the rules this drops.
  jsxA11y.flatConfigs.recommended,
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
      'style/max-len': ['error', { code: 120 }],
    },
  },
  {
    files: ['**/*.md', '**/*.mdx'],
    rules: {
      'style/max-len': 'off', // Disable max-len for markdown files
    },
  },
);
