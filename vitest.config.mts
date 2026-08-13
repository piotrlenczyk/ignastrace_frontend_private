import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

const include = ['src/**/*.test.{js,jsx,ts,tsx}'];

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

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    coverage: {
      include: ['src/**/*'],
      exclude: ['src/**/*.stories.{js,jsx,ts,tsx}', '**/*.d.ts'],
    },
    projects: [
      {
        plugins: [react(), tsconfigPaths()],
        test: {
          ...shared,
          name: 'node',
          environment: 'node',
          include,
          exclude: domTests,
        },
      },
      {
        plugins: [react(), tsconfigPaths()],
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
