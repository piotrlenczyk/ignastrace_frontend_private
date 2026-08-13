/**
 * @type {import('prettier').Config}
 */
export default {
  singleQuote: true,
  semi: true,

  /*
   * Not an arbitrary number. `better-tailwindcss/enforce-consistent-line-wrapping`
   * is configured with the same width in eslint.config.mjs, so the two tools
   * break a long `className` at the same column instead of taking turns undoing
   * each other.
   */
  printWidth: 120,
};
