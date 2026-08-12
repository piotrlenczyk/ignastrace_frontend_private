// Please do not use the array form (like ['tailwindcss', 'postcss-preset-env'])
// it will create an unexpected error: Invalid PostCSS Plugin found: [0]

/*
 * Tailwind v4 resolves `@import`, nesting and vendor prefixes itself, so the
 * plugins that used to do that (postcss-import, @tailwindcss/nesting,
 * autoprefixer) are gone. cssnano is gone too: Next.js already minifies CSS in
 * production builds, and cssnano mangles the `@property` registrations v4
 * depends on.
 */

/** @type {import('postcss-load-config').Config} */
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
