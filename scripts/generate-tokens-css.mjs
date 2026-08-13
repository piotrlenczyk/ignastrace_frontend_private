#!/usr/bin/env node
// figma-variables.json -> src/styles/new/{primitives,semantics,typo}.css
//
// Three files because they are consumed differently: primitives are the palette (never
// referenced directly from components), semantics are the intent layer components do use,
// typo carries the named text styles.
//
// Only semantics and typo enter Tailwind's theme, so only their names generate utilities.
// The palette is deliberately left out — see docs/adr/0004-token-layers-and-the-tailwind-theme.md.
//
// Local wins. The Figma file overrides the corporate library on purpose — that is the whole
// point of the local collection — so wherever a semantic name exists in both, the local
// value is the one emitted, and the corporate one is dropped rather than shadowed.
//
// Usage:
//   node scripts/generate-tokens-css.mjs
//   node scripts/generate-tokens-css.mjs --input figma-variables.json --outdir src/styles/new

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import { format, resolveConfig } from 'prettier';

const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  args[process.argv[i].replace(/^--/, '')] = process.argv[i + 1];
}
const INPUT = args.input ?? 'figma-variables.json';
const OUTDIR = args.outdir ?? 'src/styles/new';

const tokens = JSON.parse(readFileSync(INPUT, 'utf8'));
const warnings = [];

// ---------------------------------------------------------------- naming ----
// Figma names carry their own folder structure: "Component colors/Utility/Purple/purple-700"
// arrives flattened as `component-colors-utility-purple-utility-purple-700`. Both halves of
// that are noise in CSS — the `component-colors` wrapper says where the token sits in the
// Figma picker, and the group name is repeated in every child. Strip both and it reads as
// `utility-purple-700`.
function collapseRepeats(segs) {
  for (let k = Math.floor(segs.length / 2); k >= 1; k--) {
    if (segs.slice(0, k).every((s, i) => s === segs[k + i])) {
      return collapseRepeats(segs.slice(k));
    }
  }
  return segs;
}

function cssName(name) {
  let segs = name.split('-');
  if (segs[0] === 'component' && segs[1] === 'colors') {
    segs = segs.slice(2);
  }
  return collapseRepeats(segs).join('-');
}

// Shortening can in principle make two distinct Figma tokens land on one CSS name. Within a
// single source that is data loss, so it is reported; across sources it is exactly the
// local-over-corporate override we want.
function rename(entries, source) {
  const out = new Map();
  for (const [name, value] of entries) {
    const short = cssName(name);
    const prev = out.get(short);
    if (prev && prev.value !== value) {
      warnings.push(`${source}: "${name}" and "${prev.name}" both shorten to "${short}" — kept "${prev.name}"`);
      continue;
    }
    if (!prev) {
      out.set(short, { name, value });
    }
  }
  return out;
}

// ------------------------------------------------------------ primitives ----
const primitives = new Map();
const primitiveSource = new Map();
for (const source of ['corporate', 'local']) {
  for (const [short, { value }] of rename(Object.entries(tokens.primitives[source] ?? {}), source)) {
    if (primitives.has(short)) {
      warnings.push(`primitive "${short}" defined in both corporate and local — local wins`);
    }
    primitives.set(short, value);
    primitiveSource.set(short, source);
  }
}

// ------------------------------------------------------------- semantics ----
// A semantic's value is the *name* of what it points at — usually a primitive, sometimes
// another semantic (`fg-brand-primary-alt` -> `fg-brand-primary`), occasionally a raw hex
// with no primitive behind it. Aliases stay aliases in CSS: `var()` keeps the local override
// flowing through to every semantic that points at an overridden one.
//
// Semantics live in Tailwind's colour namespace and primitives do not, which is what makes
// `text-fg-primary` exist while `bg-gray-700` does not. An alias therefore has to know which
// side of that line it points at: a primitive target keeps its bare name, a semantic target
// picks up the prefix.
const COLOR = '--color-';

const renamedSemantics = {
  corporate: rename(Object.entries(tokens.semantics.corporate ?? {}), 'corporate'),
  local: rename(Object.entries(tokens.semantics.local ?? {}), 'local'),
};
const semanticNames = new Set([...renamedSemantics.corporate.keys(), ...renamedSemantics.local.keys()]);

const semantics = new Map();
for (const source of ['corporate', 'local']) {
  for (const [short, { name, value }] of renamedSemantics[source]) {
    let css;
    if (typeof value === 'string' && value.startsWith('#')) {
      css = value;
    } else {
      const target = cssName(String(value));
      if (primitives.has(target)) {
        css = `var(--${target})`;
      } else if (semanticNames.has(target)) {
        css = `var(${COLOR}${target})`;
      } else {
        css = String(value);
        warnings.push(`${source}: "${name}" points at unknown token "${value}" — emitted verbatim`);
      }
    }
    semantics.set(short, { css, source, figmaName: name });
  }
}

// ------------------------------------------------------------ typography ----
// Figma ships two layers here: a scale of loose variables (`font-size-text-md`,
// `font-weight-bold`) and named text styles that reference them. Only the styles are useful
// downstream — nobody reaches for a bare font size once `text-md-regular` exists — so the
// scale is resolved away into literals. One indirection instead of two, and the generated
// file can be read without cross-referencing a second block.
//
// Tailwind's `--text-*` namespace carries `--line-height`, `--letter-spacing` and
// `--font-weight` modifiers, but there is no `--font-family` among them. Families are
// therefore emitted separately into the `--font-*` namespace and have to be applied
// alongside the style: `font-display text-display-lg-medium`.

const FAMILY_PREFIX = 'font-family-';

// A family name containing whitespace is not a valid CSS identifier and has to be quoted.
function quoteFamily(name) {
  return /\s/.test(name) ? `'${name}'` : name;
}

// Matches the fallback stack the pre-existing theme uses, so a string rendered through these
// tokens degrades identically to one rendered through `--font-sans`.
const FALLBACKS = [
  'ui-sans-serif',
  'system-ui',
  'sans-serif',
  'Apple Color Emoji',
  'Segoe UI Emoji',
  'Segoe UI Symbol',
  'Noto Color Emoji',
]
  .map(quoteFamily)
  .join(', ');

// The family name in Figma is the *design* name. next/font loads the real face under a hashed
// family name and exposes it through a custom property, so the design name on its own would
// miss the loaded face and fall through to a locally installed copy or the fallbacks. Pointing
// at the property is the only spelling that actually renders in the face the app ships.
const FONT_VARS = { Inter: '--font-inter' };

// Figma stores weights as the style name shown in its own weight picker. Only the four the
// design system actually uses are listed: a fifth would be reported rather than guessed at,
// which is the failure everyone wants — a warning naming the weight to add here beats a
// silently plausible number.
const FONT_WEIGHTS = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

const typography = new Map();
for (const source of ['corporate', 'local']) {
  for (const [short, { value }] of rename(Object.entries(tokens.typography?.[source] ?? {}), source)) {
    if (typography.has(short)) {
      warnings.push(`typography "${short}" defined in both corporate and local — local wins`);
    }
    typography.set(short, value);
  }
}

// Figma reports px; rem keeps the proportion between size and line height intact when the
// root size changes. Every value in the current file divides by 16 exactly, so nothing is
// lost in the conversion — the rounding only guards against a future half-pixel.
function rem(px) {
  return `${Number((px / 16).toFixed(4))}rem`;
}

function scaleValue(ref, style, axis) {
  const short = cssName(String(ref));
  if (typography.has(short)) {
    return typography.get(short);
  }
  warnings.push(`textStyle "${style}": ${axis} points at unknown typography token "${ref}"`);
  return null;
}

function trackingValue(spacing, style) {
  // 0 is the overwhelming majority and adding nothing to the cascade, so it is dropped rather
  // than restated on every style.
  if (!spacing || spacing.value === 0) {
    return null;
  }
  // Percent is the only unit the design system uses. A pixel tracking would be reported rather
  // than converted, for the same reason as the weights above.
  if (spacing.unit === 'PERCENT') {
    return `${Number((spacing.value / 100).toFixed(4))}em`;
  }
  warnings.push(`textStyle "${style}": letterSpacing unit "${spacing.unit}" not understood — dropped`);
  return null;
}

// `paragraphSpacing`, `textCase` and `textDecoration` are read and discarded: the first is a
// duplicate of `fontSize` throughout, the other two never leave their defaults, and CSS has
// no use for a text style that restates `text-transform: none`.
const renamedStyles = {
  corporate: rename(Object.entries(tokens.textStyles?.corporate ?? {}), 'corporate'),
  local: rename(Object.entries(tokens.textStyles?.local ?? {}), 'local'),
};

const textStyles = new Map();
for (const source of ['corporate', 'local']) {
  for (const [short, { name, value }] of renamedStyles[source]) {
    // `text-md-semibold` would otherwise become `--text-text-md-semibold`, and the class name
    // reads as a stutter. Stripping the leading segment lands the class back on the Figma
    // style name exactly: `text-md-semibold`, `text-display-lg-medium`.
    const token = short.startsWith('text-') ? short.slice('text-'.length) : short;

    const previous = textStyles.get(token);
    if (previous && previous.source === source) {
      warnings.push(
        `${source}: text styles "${name}" and "${previous.figmaName}" both map to "${token}" — kept "${previous.figmaName}"`,
      );
      continue;
    }

    const size = scaleValue(value.fontSize, name, 'fontSize');
    if (size === null) {
      warnings.push(`textStyle "${name}": no font size — style dropped`);
      continue;
    }

    const weightName = scaleValue(value.fontStyle, name, 'fontStyle');
    const weight = FONT_WEIGHTS[String(weightName).toLowerCase()] ?? null;
    if (weightName !== null && weight === null) {
      warnings.push(`textStyle "${name}": font weight "${weightName}" not understood — omitted`);
    }

    textStyles.set(token, {
      token,
      source,
      figmaName: name,
      family: cssName(String(value.fontFamily)),
      size,
      lineHeight: scaleValue(value.lineHeight, name, 'lineHeight'),
      weight,
      tracking: trackingValue(value.letterSpacing, name),
    });
  }
}

// The families partition the styles cleanly — display faces carry the headline scale, body
// faces the running text — so they double as the file's section boundaries, and each section
// can name the `font-*` class its styles need alongside them. Largest scale first, which is
// how a type specimen is read; alphabetical order would put `xl` after `sm`.
const familyScale = new Map();
for (const style of textStyles.values()) {
  familyScale.set(style.family, Math.max(familyScale.get(style.family) ?? 0, style.size));
}
const families = [...familyScale.keys()].sort((a, b) => familyScale.get(b) - familyScale.get(a));

// ---------------------------------------------------------------- output ----
const byName = (a, b) => a[0].localeCompare(b[0], 'en', { numeric: true });

function header(title, note) {
  const src = tokens._meta?.source;
  return [
    '/*',
    ` * ${title}`,
    ' *',
    ` * AUTO-GENERATED from ${INPUT} by scripts/generate-tokens-css.mjs — do not edit by hand.`,
    src ? ` * Source: Figma "${src.fileName}" (${src.fileKey}), light mode.` : null,
    ` * ${note}`,
    ' */',
    '',
  ]
    .filter((line) => line !== null)
    .join('\n');
}

const primitiveLines = [...primitives.entries()].sort(byName).map(([name, value]) => {
  const local = primitiveSource.get(name) === 'local' ? ' /* local */' : '';
  return `  --${name}: ${value};${local}`;
});

const semanticLines = [...semantics.entries()].sort(byName).map(([name, { css, source }]) => {
  const local = source === 'local' ? ' /* local */' : '';
  return `  ${COLOR}${name}: ${css};${local}`;
});

function familyValue(designName) {
  const variable = FONT_VARS[designName];
  if (!variable) {
    warnings.push(
      `typography: font family "${designName}" has no entry in FONT_VARS — emitted as a plain family name, which will not resolve to the face the app loads`,
    );
    return `${quoteFamily(designName)}, ${FALLBACKS}`;
  }
  return `var(${variable}), ${FALLBACKS}`;
}

// A family only earns a `--font-*` token if the scale defines it under the expected prefix.
// The label doubles as the section heading below, so the two cannot disagree about whether a
// `font-*` class exists — a heading promising a class the file never emitted would be worse
// than no heading at all.
const familyLabels = new Map();
for (const family of families) {
  if (!family.startsWith(FAMILY_PREFIX)) {
    warnings.push(
      `text styles reference "${family}" as a font family, which is not a ${FAMILY_PREFIX}* token — omitted`,
    );
    continue;
  }
  const designName = typography.get(family);
  if (designName === undefined) {
    warnings.push(
      `text styles reference font family "${family}", which the typography scale does not define — omitted`,
    );
    continue;
  }
  familyLabels.set(family, { label: family.slice(FAMILY_PREFIX.length), designName: String(designName) });
}

const familyLines = [...familyLabels.values()].map(
  ({ label, designName }) => `  --font-${label}: ${familyValue(designName)};`,
);

for (const key of typography.keys()) {
  if (key.startsWith(FAMILY_PREFIX) && !familyLabels.has(key)) {
    warnings.push(`typography: font family "${key}" is used by no text style — omitted`);
  }
}

const styleSections = families.map((family) => {
  const emitted = familyLabels.get(family);
  const heading = emitted
    ? `  /* ---- ${emitted.label} — pair with font-${emitted.label} ---- */`
    : `  /* ---- ${family} — no family token emitted, see warnings ---- */`;
  const blocks = [...textStyles.values()]
    .filter((style) => style.family === family)
    .sort((a, b) => b.size - a.size || (a.weight ?? 0) - (b.weight ?? 0) || a.token.localeCompare(b.token))
    .map((style) => {
      const local = style.source === 'local' ? ' /* local */' : '';
      const lines = [`  --text-${style.token}: ${rem(style.size)};${local}`];
      if (style.lineHeight !== null) {
        lines.push(`  --text-${style.token}--line-height: ${rem(style.lineHeight)};`);
      }
      if (style.weight !== null) {
        lines.push(`  --text-${style.token}--font-weight: ${style.weight};`);
      }
      if (style.tracking !== null) {
        lines.push(`  --text-${style.token}--letter-spacing: ${style.tracking};`);
      }
      return lines.join('\n');
    });
  // No blank line between styles, tempting though it is: the list reads as one
  // block that way, and the section heading is what separates groups.
  return [`${heading}\n`, ...blocks].join('\n');
});

mkdirSync(OUTDIR, { recursive: true });

/*
 * Written through Prettier rather than straight to disk. Prettier formats CSS
 * in this repository, so a generator that emitted its own whitespace would make
 * every regeneration produce a diff of nothing but reformatting — and the first
 * `npm run format` after one would produce a second.
 */
const prettierOptions = await resolveConfig(join(OUTDIR, 'primitives.css'));

async function writeCss(name, contents) {
  const path = join(OUTDIR, name);
  writeFileSync(path, await format(contents, { ...prettierOptions, filepath: path }));
}

await writeCss(
  'primitives.css',
  `${header(
    'Primitives — the raw palette.',
    'Do not reference these from components; use semantics.css instead.',
  )}:root {\n${primitiveLines.join('\n')}\n}\n`,
);

/*
 * `static` rather than a plain `@theme`, here and in typo.css below. Tailwind
 * only emits a theme variable into :root if some utility built from it survives
 * the scan, so under a plain block an intent nobody has used as a class yet does
 * not exist at runtime at all — it cannot be inspected in devtools and cannot be
 * reached by `var(--color-…)` from hand-written CSS. During a redesign that is
 * backwards: the tokens are least used exactly when they most need to be
 * legible. `static` emits all of them, which costs a few kilobytes before
 * compression. See docs/adr/0005-two-colour-systems-during-the-redesign.md,
 * which corrects record 0004 on this point.
 */
await writeCss(
  'semantics.css',
  `${header(
    'Semantics — colour intent tokens.',
    'Requires primitives.css. Tokens tagged "local" come from this Figma file and override the corporate library.',
  )}@import "./primitives.css";\n\n@theme static {\n${semanticLines.join('\n')}\n}\n`,
);

await writeCss(
  'typo.css',
  `${header(
    'Typography — named text styles.',
    "A style sets size, line height, weight and tracking; the font family is a separate font-* class, because Tailwind's --text-* namespace has no family modifier. Families point at the custom property next/font exposes.",
  )}@theme static {\n  /* ---- families ---- */\n${familyLines.join('\n')}\n\n${styleSections.join('\n\n')}\n}\n`,
);

// ---------------------------------------------------------------- report ----
const localSemantics = [...semantics.values()].filter((s) => s.source === 'local').length;
const overrides = [...semantics.entries()].filter(
  ([name, s]) => s.source === 'local' && renamedSemantics.corporate.has(name),
).length;

const localStyles = [...textStyles.values()].filter((s) => s.source === 'local').length;

console.log(`${relative(process.cwd(), join(OUTDIR, 'primitives.css'))}  ${primitives.size} tokens`);
console.log(
  `${relative(process.cwd(), join(OUTDIR, 'semantics.css'))}   ${semantics.size} tokens (${localSemantics} local, ${overrides} overriding corporate)`,
);
console.log(
  `${relative(process.cwd(), join(OUTDIR, 'typo.css'))}        ${textStyles.size} text styles, ${familyLines.length} families (${localStyles} local)`,
);
if (warnings.length) {
  console.log('');
  for (const w of warnings) {
    console.log(`warning: ${w}`);
  }
}
