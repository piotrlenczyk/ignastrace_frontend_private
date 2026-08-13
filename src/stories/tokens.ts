/*
 * The foundation stories read src/styles/new as text rather than listing tokens
 * by hand. Those three files are generated from figma-variables.json, so a
 * re-run of `npm run generate:tokens-css` moves the catalogue with the design
 * file and there is no second list to forget to update.
 */
import primitivesCss from '@/styles/new/primitives.css?raw';
import semanticsCss from '@/styles/new/semantics.css?raw';
import typoCss from '@/styles/new/typo.css?raw';

export type Token = {
  /** Token name with its namespace prefix stripped, e.g. `bg-brand-solid`. */
  name: string;
  /** What the generated CSS declares, e.g. `var(--primary-color-600)`. */
  declared: string;
  /** The literal colour the declaration resolves to, e.g. `#2970ff`. */
  value: string;
  /** The custom property to read in markup, e.g. `--color-bg-brand-solid`. */
  variable: string;
};

export type TokenGroup = {
  name: string;
  tokens: Token[];
};

const DECLARATION = /^\s*--([\w-]+):\s*([^;]+);/gm;

const declarations = (css: string): Array<[string, string]> =>
  [...css.matchAll(DECLARATION)].map(([, name = '', value = '']) => [name, value.trim().replace(/\s+/g, ' ')]);

/* The raw palette, keyed by bare name — `gray-500`, `base-white`. */
const primitives = new Map(declarations(primitivesCss));

/*
 * Semantics alias primitives one level deep (`--color-bg-brand-solid:
 * var(--primary-color-600)`), and a handful are literal hex. Following the alias
 * here rather than in the browser keeps the stories pure — no layout effect, no
 * getComputedStyle, and the same output in a docs page as in a canvas.
 */
const resolve = (declared: string): string => {
  const alias = /^var\(--([\w-]+)\)$/.exec(declared);

  if (!alias?.[1]) return declared;

  return primitives.get(alias[1]) ?? declared;
};

const groupBy = (tokens: Token[], group: (token: Token) => string): TokenGroup[] => {
  const groups = new Map<string, Token[]>();

  for (const token of tokens) {
    const key = group(token);
    groups.set(key, [...(groups.get(key) ?? []), token]);
  }

  return [...groups.entries()].map(([name, groupTokens]) => ({ name, tokens: groupTokens }));
};

/*
 * Colour intent tokens — what markup is allowed to name. `--color-` is the
 * Tailwind namespace that turns each one into `bg-*`, `text-*`, `border-*`
 * utilities, so it is stripped: the story shows `bg-brand-solid`, which is what
 * a designer and the Figma file both call it.
 */
export const semanticColorGroups: TokenGroup[] = groupBy(
  declarations(semanticsCss)
    .filter(([name]) => name.startsWith('color-'))
    .map(([name, declared]) => {
      const bare = name.slice('color-'.length);

      return { name: bare, declared, value: resolve(declared), variable: `--${name}` };
    }),
  (token) => token.name.split('-')[0] ?? 'other',
);

/*
 * The raw scale. Grouped by family, which means dropping the numeric step —
 * `blue-dark-700` is the `blue-dark` family, not `blue`.
 */
export const primitiveColorGroups: TokenGroup[] = groupBy(
  [...primitives.entries()].map(([name, declared]) => ({
    name,
    declared,
    value: declared,
    variable: `--${name}`,
  })),
  (token) => token.name.replace(/-\d+$/, ''),
);

export type TextStyle = {
  /** e.g. `display-xl-medium`, used as the class `text-display-xl-medium`. */
  name: string;
  family: 'display' | 'body';
  fontSize: string;
  lineHeight: string;
  fontWeight: string;
  letterSpacing: string;
};

/*
 * Named text styles. A style carries size, line height, weight and tracking as
 * four custom properties — the base one plus `--line-height`, `--font-weight`
 * and `--letter-spacing` suffixes — and the family is deliberately not among
 * them, which is why every sample below also picks `font-display` or
 * `font-body`. Tracking is absent on the smaller steps and defaults to normal.
 */
export const textStyles: TextStyle[] = declarations(typoCss)
  .filter(([name]) => name.startsWith('text-') && !name.includes('--'))
  .map(([name, fontSize]) => {
    const modifier = (suffix: string) =>
      declarations(typoCss).find(([candidate]) => candidate === `${name}--${suffix}`)?.[1] ?? '';

    return {
      name: name.slice('text-'.length),
      family: name.startsWith('text-display-') ? ('display' as const) : ('body' as const),
      fontSize,
      lineHeight: modifier('line-height'),
      fontWeight: modifier('font-weight'),
      letterSpacing: modifier('letter-spacing') || 'normal',
    };
  });

/** `1.875rem` → `30px`, for the spec column next to each sample. */
export const remToPx = (value: string): string => {
  const rem = /^([\d.]+)rem$/.exec(value);

  return rem?.[1] ? `${Number.parseFloat(rem[1]) * 16}px` : value;
};
