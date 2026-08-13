import { fileURLToPath } from 'node:url';

import type { StorybookConfig } from '@storybook/nextjs-vite';
import type { Alias, AliasOptions } from 'vite';

/*
 * Storybook is the workbench for the v2 design system — the new tokens in
 * src/styles/new and everything rebuilt against them: the ui/v2 components, the
 * v2 navigation and footer, and the rebuilt reverse-lookup sections. Legacy
 * components are deliberately not catalogued: they are frozen and get deleted
 * with the old theme, so a story for one would have a known expiry date.
 *
 * The builder is Vite rather than webpack: this repository already runs Vite 8
 * (Vitest) and PostCSS/Tailwind v4, so `@storybook/nextjs-vite` reuses the
 * toolchain that is here instead of adding a second one. It still applies the
 * Next-specific shims the components need — next/image, next/font and the App
 * Router mocks that `usePathname` and `useSearchParams` depend on.
 */

const alias = (aliases: AliasOptions | undefined): Alias[] =>
  Array.isArray(aliases)
    ? aliases
    : Object.entries(aliases ?? {}).map(([find, replacement]) => ({ find, replacement: String(replacement) }));

const config: StorybookConfig = {
  framework: {
    name: '@storybook/nextjs-vite',
    options: {},
  },
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  staticDirs: ['../public'],

  core: {
    // Nothing about this repository leaves it for a dev tool's analytics.
    disableTelemetry: true,
  },

  viteFinal: (viteConfig) => ({
    ...viteConfig,
    resolve: {
      ...viteConfig.resolve,
      alias: [
        ...alias(viteConfig.resolve?.alias),
        /*
         * The one module a browser cannot load. `@/actions/funnel-phone-number`
         * is a `'use server'` file — it pulls in next/headers and the NextAuth
         * config at import time — and LookupForm calls it on submit, so every
         * story that shows a lookup form transitively imports it.
         */
        {
          find: /^@\/actions\/funnel-phone-number$/,
          replacement: fileURLToPath(new URL('./mocks/funnel-phone-number.ts', import.meta.url)),
        },
      ],
    },
  }),
};

export default config;
