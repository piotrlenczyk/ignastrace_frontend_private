#!/usr/bin/env node
// Step 4 — turn the raw per-collection dumps from Figma into figma-variables.json.
//
// This script owns naming and classification. Keeping both here (rather than in the Figma
// scripts) means token names are reproducible without re-hitting Figma, and a naming fix is
// a one-line change plus a re-run over the same .tmp dump.
//
// Usage:
//   node assemble.mjs --input .tmp/figma-tokens --output figma-variables.json \
//     --corporate "_Primitives,1. Color modes,6. Typography" \
//     --file-name "Ignastrace.io" --file-key P49JZ2fY4oCoD25vpUQXNU

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  args[process.argv[i].replace(/^--/, '')] = process.argv[i + 1];
}
const INPUT = args.input ?? '.tmp/figma-tokens';
const OUTPUT = args.output ?? 'figma-variables.json';
const CORPORATE = new Set(
  (args.corporate ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);
const FILE_NAME = args['file-name'] ?? null;
const FILE_KEY = args['file-key'] ?? null;

// ---------------------------------------------------------------- naming ----
// Figma paths are written for designers browsing a picker; token names are read in code.
// Strip the annotations designers add for themselves, then collapse the repetition that
// nesting creates, so "Colors/Text/text-primary (900)" reads as "text-primary".
const ABBREV = { background: 'bg', foreground: 'fg', shadows: 'shadow', colours: 'color' };

function kebab(part) {
  return part
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9%]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Designers annotate variable names in parentheses for two very different reasons, and the
// difference matters. "(900)" or "(320px)" just restates the value — noise in a token name.
// "(dark mode)" identifies *which* ramp this is; drop that and "Gray (light mode)/900" and
// "Gray (dark mode)/900" become the same token, so one silently overwrites the other. So:
// throw away the restatements, throw away the annotation naming the mode we are exporting
// (it is implied by the whole file), and keep every other one.
const EXPORTED_MODE = 'light';
function stripAnnotations(name) {
  return name.replace(/\s*\(([^)]*)\)/g, (_, inner) => {
    if (/^[\d.,\s]+(px)?$/i.test(inner)) return '';
    if (/\b(light|dark)\b/i.test(inner)) {
      return new RegExp(`\\b${EXPORTED_MODE}\\b`, 'i').test(inner) ? '' : ' ' + inner;
    }
    return ' ' + inner;
  });
}

function segments(name) {
  return stripAnnotations(name).split('/').map(kebab).filter(Boolean);
}

function slugify(name, { collapse = true } = {}) {
  const parts = segments(name);
  if (!collapse) return parts.join('-');
  if (parts.length > 1 && parts[0] === 'colors') parts.shift();
  for (let i = parts.length - 1; i > 0; i--) {
    const cur = parts[i];
    // A group segment repeats in its children in three ways: verbatim ("Text/text-primary"),
    // as an abbreviation ("Background/bg-primary"), or as a plural ("Shadows/shadow-xs",
    // "Focus rings/focus-ring"). All three are the designer's folder showing through, not
    // information — drop the group and keep the leaf.
    const forms = [parts[i - 1], parts[i - 1].replace(/s$/, ''), ABBREV[parts[i - 1]]].filter(Boolean);
    if (forms.some((f) => cur === f || cur.startsWith(f + '-'))) parts.splice(i - 1, 1);
  }
  return parts.join('-') || kebab(name);
}

// ------------------------------------------------------------ load input ----
const files = readdirSync(INPUT).filter((f) => f.endsWith('.json'));
// A collection that had to be sliced across calls arrives as several dumps. Merge them back
// before anything is classified — the primitive/semantic call below looks at the balance of
// the whole collection, and a half-collection gives a different (wrong) answer.
const merged = new Map();
let styleDump = null;
for (const f of files) {
  const parsed = JSON.parse(readFileSync(join(INPUT, f), 'utf8'));
  for (const data of Array.isArray(parsed) ? parsed : [parsed]) {
    if (!Array.isArray(data.rows)) continue;
    if (!data.collection) {
      styleDump = data;
      continue;
    }
    const prev = merged.get(data.collectionId);
    if (prev) prev.rows.push(...data.rows);
    else merged.set(data.collectionId, { ...data, rows: [...data.rows] });
  }
}
const varDumps = [...merged.values()];
if (!varDumps.length) throw new Error(`No variable dumps found in ${INPUT}`);

const sourceOf = (dump) => (dump.remote === false ? 'local' : CORPORATE.has(dump.collection) ? 'corporate' : null);

// Alias vs raw value decides primitive vs semantic — but only per variable in a collection
// that genuinely mixes the two (a brand override file defines its ramp *and* its intent
// tokens side by side). A collection that is overwhelmingly aliases is a semantic layer, and
// the few raw values in it (alpha overlays, one-off borders) are intent tokens the design
// system never bothered to give a primitive to. Filing those under primitives would be a lie.
const SEMANTIC_LAYER_RATIO = 0.8;
const roleOf = (dump) => {
  const aliases = dump.rows.filter(([, kind]) => kind === 'a').length;
  return aliases / Math.max(1, dump.rows.length) >= SEMANTIC_LAYER_RATIO ? 'semantics' : null;
};

// ------------------------------------------------------------- index all ----
const index = new Map(); // figma full name -> record
const duplicateNames = [];
const excluded = [];
const modes = {};

for (const dump of varDumps) {
  const source = sourceOf(dump);
  if (!source) {
    excluded.push({
      collection: dump.collection,
      variables: dump.rows.length,
      reason: 'not part of the design system',
    });
    continue;
  }
  modes[dump.collection] = dump.modeUsed;
  const forcedRole = roleOf(dump);

  for (const [name, kind, value] of dump.rows) {
    if (index.has(name)) duplicateNames.push({ name, collection: dump.collection });
    index.set(name, { name, kind, value, source, collection: dump.collection, forcedRole });
  }
}

// Follow an alias chain to the value at the end of it. Classification needs the *type* of the
// value (colour vs number vs font name), and an alias by itself does not reveal it.
const unresolved = [];
function resolveFinal(name, seen = new Set()) {
  const rec = index.get(name);
  if (!rec || seen.has(name)) return null;
  seen.add(name);
  return rec.kind === 'a' ? resolveFinal(rec.value, seen) : rec.value;
}

// ------------------------------------------------------------- classify ----
// Sections are split by what the token *is*, because a colour relationship and a spacing step
// are consumed by completely different parts of the code. Keeping them in one bucket forces
// every consumer to re-sort them, and makes "how many colours do we have" unanswerable.
//
// The type of the resolved value does the heavy lifting: a token that ends at a number cannot
// be a colour, whatever it is called. Names only pick *which* dimension bucket it lands in.
const isTypography = (collection, name) =>
  /typograph|^font/i.test(collection) || /^(font (size|weight|family)|line height|letter spacing)\//i.test(name);

function dimensionSection(collection, name) {
  if (/radius/i.test(collection) || /(^|\/)(corner.?)?radius/i.test(name)) return 'radius';
  if (/width|container/i.test(collection) || /(^|\/)(width|container)/i.test(name)) return 'sizing';
  if (/spacing/i.test(collection) || /(^|\/)spacing/i.test(name)) return 'spacing';
  return 'dimensions';
}

function sectionOf(rec) {
  if (isTypography(rec.collection, rec.name)) return 'typography';
  const final = resolveFinal(rec.name);
  if (typeof final === 'number') return dimensionSection(rec.collection, rec.name);
  // Shadow colours are colours, but they are neither palette nor intent — they are the input
  // to an effect, and mixing them into semantics buries them among 200 unrelated tokens.
  if (/shadow/i.test(rec.name)) return 'shadows';
  if (typeof final === 'string' && !final.startsWith('#')) return 'typography';
  return rec.forcedRole ?? (rec.kind === 'a' ? 'semantics' : 'primitives');
}

const SECTIONS = [
  'primitives',
  'semantics',
  'shadows',
  'spacing',
  'radius',
  'sizing',
  'dimensions',
  'typography',
  'textStyles',
];
// Dimensions are emitted as final numbers rather than as a pointer to the numeric primitive.
// The indirection earns its keep for colour — a palette swap is a real event that has to
// propagate — but nobody re-points a 16px step at a different number, and a plain number is
// what a Tailwind or CSS config actually wants.
const RESOLVE_TO_VALUE = new Set(['spacing', 'radius', 'sizing', 'dimensions']);

const out = Object.fromEntries(SECTIONS.map((s) => [s, { corporate: {}, local: {} }]));
const slugByName = new Map();
const collisions = [];

for (const rec of index.values()) {
  const section = sectionOf(rec);
  const bucket = out[section][rec.source];

  let slug = slugify(rec.name);
  if (Object.prototype.hasOwnProperty.call(bucket, slug)) {
    const full = slugify(rec.name, { collapse: false });
    collisions.push({ name: rec.name, collidedOn: slug, usedInstead: full });
    slug = full;
  }
  bucket[slug] = { section, rec };
  slugByName.set(rec.name, slug);
}

for (const section of SECTIONS) {
  for (const source of ['corporate', 'local']) {
    const bucket = out[section][source];
    for (const [slug, { rec }] of Object.entries(bucket)) {
      if (RESOLVE_TO_VALUE.has(section)) {
        const final = resolveFinal(rec.name);
        if (final === null) unresolved.push({ token: slug, section, source, alias: rec.value });
        bucket[slug] = final;
        continue;
      }
      if (rec.kind !== 'a') {
        bucket[slug] = rec.value;
        continue;
      }
      // Keep the pointer, not the value: that indirection is the whole point of a semantic.
      const target = rec.value ? slugByName.get(rec.value) : null;
      if (!target) unresolved.push({ token: slug, section, source, alias: rec.value });
      bucket[slug] = target ?? rec.value;
    }
  }
}

// ---------------------------------------------------------- text styles -----
if (styleDump) {
  const VAR_FIELDS = ['fontFamily', 'fontStyle', 'fontSize', 'lineHeight', 'paragraphSpacing'];
  for (const s of styleDump.rows) {
    const boundCollections = Object.values(s.bound ?? {}).map((b) => b.collection);
    const source = s.remote === false ? 'local' : boundCollections.some((c) => CORPORATE.has(c)) ? 'corporate' : null;
    if (!source) {
      excluded.push({ textStyle: s.name, reason: 'not bound to design system typography' });
      continue;
    }
    const style = {};
    for (const field of VAR_FIELDS) {
      const bound = s.bound?.[field];
      style[field] = bound ? slugify(bound.name) : s[field];
    }
    style.letterSpacing = s.letterSpacing;
    style.textCase = s.textCase;
    style.textDecoration = s.textDecoration;
    out.textStyles[source][slugify(s.name)] = style;
  }
}

// ------------------------------------------------------------- finalise -----
const sortKeys = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
for (const section of SECTIONS) {
  for (const source of ['corporate', 'local']) out[section][source] = sortKeys(out[section][source]);
}
// An empty section is noise in a file people read by hand.
for (const section of SECTIONS) {
  if (!Object.keys(out[section].corporate).length && !Object.keys(out[section].local).length) {
    delete out[section];
  }
}

const counts = {};
for (const section of Object.keys(out)) {
  counts[section] = {
    corporate: Object.keys(out[section].corporate).length,
    local: Object.keys(out[section].local).length,
  };
}

out._meta = {
  source: { fileName: FILE_NAME, fileKey: FILE_KEY },
  mode: 'light only — semantics point at a single primitive, no light/dark split',
  sections: {
    primitives: 'raw colour values — the palette',
    semantics: 'colour intent tokens; the value is the *name* of the primitive they point at',
    shadows: 'colour values used as shadow/effect inputs',
    spacing: 'spacing scale, resolved to numbers (px)',
    radius: 'corner radius scale, resolved to numbers (px)',
    sizing: 'width and container sizes, resolved to numbers (px)',
    dimensions: 'other numeric tokens that fit none of the above',
    typography: 'font family / weight / size / line height variables',
    textStyles: 'named text styles, referencing the typography variables above',
  },
  sources: {
    corporate: "shared 'Corporate Design System' Figma library — owned by another team, do not edit here",
    local: "defined in this Figma file — this project's own overrides",
  },
  collectionsIncluded: Object.keys(modes),
  modeUsedPerCollection: modes,
  counts,
  excluded,
  collisions,
  duplicateNames,
  unresolvedAliases: unresolved,
};

writeFileSync(OUTPUT, JSON.stringify(out, null, 2) + '\n');

console.log(`Wrote ${OUTPUT}`);
for (const [section, c] of Object.entries(counts)) {
  console.log(
    `  ${section.padEnd(11)} corporate ${String(c.corporate).padStart(4)}   local ${String(c.local).padStart(4)}`,
  );
}
if (excluded.length) console.log(`  excluded: ${excluded.length} (see _meta.excluded)`);
if (collisions.length) console.log(`  collisions: ${collisions.length} (see _meta.collisions)`);
if (duplicateNames.length) console.log(`  duplicate figma names: ${duplicateNames.length} (see _meta.duplicateNames)`);
if (unresolved.length) console.log(`  unresolved aliases: ${unresolved.length} (see _meta.unresolvedAliases)`);
