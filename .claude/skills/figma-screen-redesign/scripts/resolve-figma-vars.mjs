#!/usr/bin/env node
/*
 * Turns the variable names a Figma node reports into the classes this codebase
 * actually has — and, more importantly, names the ones it does not have.
 *
 * `get_variable_defs` answers "what did the designer bind here", in Figma's
 * vocabulary ("Colors/Text/text-primary (900)", "spacing-xl", "radius-lg").
 * The generated stylesheets answer "what can markup name". Matching the two by
 * eye is where a redesign quietly goes wrong: the names are close enough that a
 * near-miss reads as a hit, so `text-tertiary` gets written where the design
 * said `text-tertiary-brand` and nothing anywhere complains.
 *
 * So this does the match mechanically and splits the result in two: resolved
 * names with the class to write, and gaps. A gap is not a failure — it is the
 * question to put to the user before any code gets written, because the fix is
 * either a Figma change plus a token re-export or a deliberate exception, and
 * neither is something to decide silently mid-implementation.
 *
 * Usage (from the repo root):
 *
 *   node .claude/skills/figma-screen-redesign/scripts/resolve-figma-vars.mjs <<'EOF'
 *   Colors/Text/text-primary (900)
 *   bg-brand-solid
 *   spacing-xl
 *   radius-lg
 *   text-lg-semibold
 *   Effects/shadow-sm
 *   EOF
 *
 * Accepts one name per line, or the JSON that get_variable_defs returns (object
 * or array — keys are read as names, and `Name: value` lines are split). Pass a
 * file path instead of using stdin if that is easier. Exits 1 when there are
 * gaps, so a wrapper can tell "clean" from "needs a decision".
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const NEW_STYLES = path.join(ROOT, 'src/styles/new');

// ---------------------------------------------------------------- input

async function readInput() {
  const fileArg = process.argv[2];
  if (fileArg && !fileArg.startsWith('-')) return readFile(fileArg, 'utf8');
  if (process.stdin.isTTY) {
    console.error('Nothing on stdin. Pipe variable names in, or pass a file path.');
    process.exit(2);
  }
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

/*
 * get_variable_defs output has taken a few shapes across Figma MCP versions
 * (a name→value map, a list of objects, a plain block of "Name: value" lines),
 * and the difference is not worth a decision at the call site.
 */
function extractNames(raw) {
  const text = raw.trim();
  if (text.startsWith('{') || text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => (typeof entry === 'string' ? entry : (entry?.name ?? entry?.variable ?? '')));
      }
      return Object.keys(parsed);
    } catch {
      /* not JSON after all — fall through to line parsing */
    }
  }
  return text
    .split('\n')
    .map((line) => line.replace(/^[-*\s]+/, '').trim())
    .filter(Boolean)
    .map((line) => {
      // "Colors/Text/text-primary (900): #181D27" → keep the left side, but only
      // when the colon separates a name from a value rather than sitting inside one.
      const colon = line.lastIndexOf(':');
      if (colon > 0 && /^[\s#a-z0-9.,()%\-/]+$/i.test(line.slice(colon + 1))) {
        return line.slice(0, colon).trim();
      }
      return line;
    });
}

/*
 * The same normalisation the token generator applies, reduced to what matters
 * for lookup: drop the annotation that merely restates the value, kebab-case,
 * and keep the tail. Figma paths carry a group prefix the token name drops, so
 * the tail is tried before the whole path.
 */
function candidates(rawName) {
  const cleaned = rawName
    .replace(/\((?:\d+|\d+px|light mode|[\d.]+%)\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  const kebab = (value) =>
    value
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase()
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

  const segments = cleaned
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean);
  const out = new Set();
  if (segments.length) out.add(kebab(segments.at(-1)));
  out.add(kebab(cleaned.replace(/\//g, '-')));
  if (segments.length > 1) out.add(kebab(segments.slice(1).join('-')));
  return [...out].filter(Boolean);
}

// ---------------------------------------------------------------- vocabularies

async function loadVocabularies() {
  const [semantics, primitives, typo] = await Promise.all([
    readFile(path.join(NEW_STYLES, 'semantics.css'), 'utf8'),
    readFile(path.join(NEW_STYLES, 'primitives.css'), 'utf8'),
    readFile(path.join(NEW_STYLES, 'typo.css'), 'utf8'),
  ]);

  const colours = new Map();
  for (const [, name, value] of semantics.matchAll(/^\s*--color-([a-z0-9-]+):\s*([^;]+);/gm)) {
    colours.set(name, { value: value.trim(), layer: 'semantic' });
  }
  const primitiveColours = new Map();
  for (const [, name, value] of primitives.matchAll(/^\s*--([a-z0-9-]+):\s*([^;]+);/gm)) {
    primitiveColours.set(name, value.trim());
  }

  const textStyles = new Map();
  for (const [, name] of typo.matchAll(/^\s*--text-([a-z0-9-]+):\s*[\d.]+rem;/gm)) {
    if (!name.includes('--')) textStyles.set(name, true);
  }

  let figmaVars = null;
  try {
    figmaVars = JSON.parse(await readFile(path.join(ROOT, 'figma-variables.json'), 'utf8'));
  } catch {
    /* the export is optional — dimension lookups just get skipped */
  }

  return { colours, primitiveColours, textStyles, figmaVars };
}

function flattenSection(section) {
  if (!section) return new Map();
  return new Map([...Object.entries(section.corporate ?? {}), ...Object.entries(section.local ?? {})]);
}

// ---------------------------------------------------------------- mapping

/*
 * Which utility carries a token depends on the role in its name, not on where
 * the designer happened to use it — that is the whole point of an intent token.
 * `bg-*` names a surface, so it arrives as `bg-bg-*`; the doubled prefix looks
 * like a mistake and is not one. `fg-*` names icon and glyph colour, which in
 * this codebase rides on currentColor, so it becomes a text utility on the
 * element wrapping the svg.
 */
function utilityFor(token) {
  if (token.startsWith('bg-')) return { class: `bg-${token}`, note: '' };
  if (token.startsWith('text-')) return { class: `text-${token}`, note: '' };
  if (token.startsWith('border-')) {
    return { class: `border-${token}`, note: 'also divide-/outline-/ring- if the design uses it there' };
  }
  if (token.startsWith('fg-')) {
    return {
      class: `text-${token}`,
      note: 'icon colour — on the svg wrapper, via currentColor; fill-/stroke- if the icon hardcodes them',
    };
  }
  if (token.startsWith('effects-focus-ring')) {
    return { class: `ring-${token}`, note: 'pair with focus-visible:' };
  }
  if (token.startsWith('utility-') || token.startsWith('alpha-')) {
    return { class: `bg-${token} | text-${token} | border-${token}`, note: 'role comes from the usage, not the name' };
  }
  if (token.startsWith('components-')) {
    return {
      class: `bg-${token} | text-${token} | border-${token}`,
      note: 'component-scoped token — pick the prefix the Figma layer paints',
    };
  }
  return { class: `bg-${token} | text-${token} | border-${token}`, note: '' };
}

/*
 * Radius and spacing are not in the new export as CSS tokens — only colour and
 * type are. They resolve through Tailwind's scale instead, which was moved onto
 * Figma's values for lg/md/sm. The steps Figma has that Tailwind here does not
 * are worth naming rather than rounding to the nearest neighbour silently.
 */
const RADIUS_CLASS = {
  0: 'rounded-none',
  2: 'rounded-xs',
  4: 'rounded-[4px]',
  6: 'rounded-sm',
  8: 'rounded-md',
  10: 'rounded-lg',
  12: 'rounded-xl',
  16: 'rounded-2xl',
  20: 'rounded-[20px]',
  24: 'rounded-3xl',
  9999: 'rounded-full',
};

function spacingClass(px) {
  if (px % 4 === 0) return `${px / 4} (e.g. p-${px / 4}, gap-${px / 4}, mt-${px / 4})`;
  if (px % 2 === 0) return `${px / 4} (e.g. p-${px / 4} — half step, valid)`;
  return `[${px}px] (off the 4px ladder — e.g. p-[${px}px])`;
}

function similar(name, pool) {
  const score = (candidate) => {
    let common = 0;
    const a = new Set(name.split('-'));
    for (const part of candidate.split('-')) if (a.has(part)) common += 1;
    return common - Math.abs(candidate.length - name.length) / 40;
  };
  return [...pool].sort((x, y) => score(y) - score(x)).slice(0, 3);
}

function resolve(rawName, vocab) {
  const tried = candidates(rawName);
  const spacing = flattenSection(vocab.figmaVars?.spacing);
  const radius = flattenSection(vocab.figmaVars?.radius);
  const sizing = flattenSection(vocab.figmaVars?.sizing);
  const shadows = flattenSection(vocab.figmaVars?.shadows);

  for (const token of tried) {
    if (vocab.colours.has(token)) {
      const utility = utilityFor(token);
      return {
        kind: 'colour',
        token,
        resolved: true,
        class: utility.class,
        detail: `→ ${vocab.colours.get(token).value}`,
        note: utility.note,
      };
    }
  }

  for (const token of tried) {
    /*
     * Figma names the body styles `text-lg-semibold`, but the CSS custom
     * property is `--text-lg-semibold`, so the token half is `lg-semibold` and
     * the class is `text-` + that. Stripping the leading `text-` is what closes
     * the gap; the display styles keep their `display-` prefix in both places.
     */
    const forms = [token, token.replace(/^text-/, ''), `display-${token}`];
    const found = forms.find((form) => vocab.textStyles.has(form));
    if (found) {
      const family = found.startsWith('display-') ? 'font-display' : 'font-body';
      return {
        kind: 'text style',
        token: found,
        resolved: true,
        class: `text-${found} ${family}`,
        detail: '',
        note: 'the family is a separate class — a text style alone sets no typeface',
      };
    }
  }

  for (const token of tried) {
    if (radius.has(token)) {
      const px = radius.get(token);
      const cls = RADIUS_CLASS[px] ?? `rounded-[${px}px]`;
      return {
        kind: 'radius',
        token,
        resolved: true,
        class: cls,
        detail: `${px}px`,
        note: cls.includes('[') ? 'no named step for this value in this project' : '',
      };
    }
    if (spacing.has(token)) {
      const px = spacing.get(token);
      return { kind: 'spacing', token, resolved: true, class: spacingClass(px), detail: `${px}px`, note: '' };
    }
    if (sizing.has(token)) {
      const px = sizing.get(token);
      return {
        kind: 'sizing',
        token,
        resolved: true,
        class: `w-[${px}px] / max-w-[${px}px]`,
        detail: `${px}px`,
        note: 'check for an existing container class before hardcoding a width',
      };
    }
    /*
     * An Untitled UI shadow is several stacked layers, so the export carries
     * `effects-shadow-sm-01` and `-02` where the design file shows one effect
     * style called `shadow-sm`. Match on prefix or the name never lands.
     */
    const shadowLayers = [...shadows.keys()].filter((key) => key === token || key.startsWith(`${token}-`));
    if (shadowLayers.length) {
      return {
        kind: 'shadow',
        token,
        resolved: false,
        class: '',
        detail: `${shadowLayers.length} layer(s): ${shadowLayers.join(', ')}`,
        note: "the new system exports shadow *colours* only, with no matching shadow utility — Tailwind's own shadow-* is close but not these values. Decide with the user.",
      };
    }
  }

  for (const token of tried) {
    if (vocab.primitiveColours.has(token)) {
      return {
        kind: 'primitive',
        token,
        resolved: true,
        class: `bg-${token} | text-${token} | border-${token}`,
        detail: `→ ${vocab.primitiveColours.get(token)}`,
        note: 'primitive, not an intent token — only correct if the design genuinely has no semantic here',
      };
    }
  }

  const pool = new Set([...vocab.colours.keys(), ...vocab.textStyles.keys()]);
  return {
    kind: 'unknown',
    token: tried[0],
    resolved: false,
    class: '',
    detail: '',
    note: `closest existing names: ${similar(tried[0] ?? '', pool).join(', ')}`,
  };
}

// ---------------------------------------------------------------- report

function pad(value, width) {
  return String(value).padEnd(width);
}

async function main() {
  const raw = await readInput();
  const names = [...new Set(extractNames(raw))].filter(Boolean);
  if (!names.length) {
    console.error('No variable names found in the input.');
    process.exit(2);
  }

  const vocab = await loadVocabularies();
  const results = names.map((name) => ({ name, ...resolve(name, vocab) }));
  const resolved = results.filter((result) => result.resolved);
  const gaps = results.filter((result) => !result.resolved);

  const nameWidth = Math.max(14, ...results.map((result) => result.name.length));
  const classWidth = Math.max(10, ...resolved.map((result) => result.class.length));

  console.log(`\nRESOLVED (${resolved.length}/${results.length})\n`);
  console.log(`  ${pad('figma variable', nameWidth)}  ${pad('class to write', classWidth)}  kind`);
  console.log(`  ${'-'.repeat(nameWidth)}  ${'-'.repeat(classWidth)}  ----`);
  for (const result of resolved) {
    console.log(
      `  ${pad(result.name, nameWidth)}  ${pad(result.class, classWidth)}  ${result.kind}${result.detail ? ` ${result.detail}` : ''}`,
    );
    if (result.note) console.log(`  ${' '.repeat(nameWidth)}  ↳ ${result.note}`);
  }

  if (gaps.length) {
    console.log(`\nGAPS (${gaps.length}) — resolve these with the user before writing code\n`);
    for (const gap of gaps) {
      console.log(`  ${gap.name}`);
      console.log(`    looked up as: ${candidates(gap.name).join(', ')}`);
      if (gap.detail) console.log(`    ${gap.detail}`);
      if (gap.note) console.log(`    ${gap.note}`);
    }
    console.log(
      '\n  A gap usually means one of three things: the Figma layer has a detached or raw\n' +
        '  value with no variable bound; the variable is newer than figma-variables.json and\n' +
        '  the export needs re-running (the figma-design-tokens skill); or it is a dimension\n' +
        '  the new system deliberately does not carry (shadows, some radii). Which one it is\n' +
        '  changes the fix, so ask rather than pick the nearest name.',
    );
    process.exit(1);
  }

  console.log('\nNo gaps — every variable in this node has a class.\n');
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
