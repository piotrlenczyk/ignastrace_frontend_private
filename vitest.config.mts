import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

/*
 * The root entry is the ratchet test, which lints against eslint.config.mjs —
 * the one piece of configuration in this repository with logic in it, and the
 * one ADR 0003 warns goes quiet rather than red when it breaks.
 */
const include = ['src/**/*.test.{js,jsx,ts,tsx}', '*.test.mts'];

/*
 * Tests that need a DOM. Vitest 3 removed `environmentMatchGlobs`; `projects`
 * is its replacement, and the globs below are the ones that option carried so
 * the split stays exactly where it was.
 */
const domTests = ['**/*.test.tsx', 'src/hooks/**/*.test.ts'];

const shared = {
  globals: true, // This is needed by @testing-library to be cleaned up after each test
  setupFiles: ['./vitest-setup.ts'],
  env: loadEnv('', process.cwd(), ''),
};

// A project does not inherit the root plugins, so each one repeats them.
const plugins = () => [react(), tsconfigPaths()];

export default defineConfig({
  plugins: plugins(),
  test: {
    coverage: {
      include: ['src/**/*'],
      exclude: ['src/**/*.stories.{js,jsx,ts,tsx}', '**/*.d.ts'],
    },
    projects: [
      {
        plugins: plugins(),
        test: {
          ...shared,
          name: 'node',
          environment: 'node',
          include,
          exclude: domTests,
        },
      },
      {
        plugins: plugins(),
        test: {
          ...shared,
          name: 'jsdom',
          environment: 'jsdom',
          include: domTests,
        },
      },
    ],
  },
});
