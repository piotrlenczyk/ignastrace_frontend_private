/*
 * The foundation stories read the generated token files as text and derive the
 * catalogue from them, so a regenerated `figma-variables.json` updates the
 * stories with no hand edit. Vite serves `?raw` imports as strings; TypeScript
 * needs telling.
 */
declare module '*.css?raw' {
  const content: string;
  export default content;
}
