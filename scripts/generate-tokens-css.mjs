#!/usr/bin/env node
// figma-variables.json -> src/styles/new/{primitives,semantics}.css
//
// Two files because they are consumed differently: primitives are the palette (never
// referenced directly from components), semantics are the intent layer components do use.
//
// Local wins. The Figma file overrides the corporate library on purpose — that is the whole
// point of the local collection — so wherever a semantic name exists in both, the local
// value is the one emitted, and the corporate one is dropped rather than shadowed.
//
// Usage:
//   node scripts/generate-tokens-css.mjs
//   node scripts/generate-tokens-css.mjs --input figma-variables.json --outdir src/styles/new

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  args[process.argv[i].replace(/^--/, "")] = process.argv[i + 1];
}
const INPUT = args.input ?? "figma-variables.json";
const OUTDIR = args.outdir ?? "src/styles/new";

const tokens = JSON.parse(readFileSync(INPUT, "utf8"));
const warnings = [];

// ---------------------------------------------------------------- naming ----
// Figma names carry their own folder structure: "Component colors/Utility/Purple/purple-700"
// arrives flattened as `component-colors-utility-purple-utility-purple-700`. Both halves of
// that are noise in CSS — the `component-colors` wrapper says where the token sits in the
// Figma picker, and the group name is repeated in every child. Strip both and it reads as
// `utility-purple-700`.
function collapseRepeats(segs) {
  for (let k = Math.floor(segs.length / 2); k >= 1; k--) {
    if (segs.slice(0, k).every((s, i) => s === segs[k + i])) return collapseRepeats(segs.slice(k));
  }
  return segs;
}

function cssName(name) {
  let segs = name.split("-");
  if (segs[0] === "component" && segs[1] === "colors") segs = segs.slice(2);
  return collapseRepeats(segs).join("-");
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
    if (!prev) out.set(short, { name, value });
  }
  return out;
}

// ------------------------------------------------------------ primitives ----
const primitives = new Map();
const primitiveSource = new Map();
for (const source of ["corporate", "local"]) {
  for (const [short, { value }] of rename(Object.entries(tokens.primitives[source] ?? {}), source)) {
    if (primitives.has(short)) warnings.push(`primitive "${short}" defined in both corporate and local — local wins`);
    primitives.set(short, value);
    primitiveSource.set(short, source);
  }
}

// ------------------------------------------------------------- semantics ----
// A semantic's value is the *name* of what it points at — usually a primitive, sometimes
// another semantic (`fg-brand-primary-alt` -> `fg-brand-primary`), occasionally a raw hex
// with no primitive behind it. Aliases stay aliases in CSS: `var()` keeps the local override
// flowing through to every semantic that points at an overridden one.
const renamedSemantics = {
  corporate: rename(Object.entries(tokens.semantics.corporate ?? {}), "corporate"),
  local: rename(Object.entries(tokens.semantics.local ?? {}), "local"),
};
const semanticNames = new Set([...renamedSemantics.corporate.keys(), ...renamedSemantics.local.keys()]);

const semantics = new Map();
for (const source of ["corporate", "local"]) {
  for (const [short, { name, value }] of renamedSemantics[source]) {
    let css;
    if (typeof value === "string" && value.startsWith("#")) {
      css = value;
    } else {
      const target = cssName(String(value));
      if (primitives.has(target) || semanticNames.has(target)) {
        css = `var(--${target})`;
      } else {
        css = String(value);
        warnings.push(`${source}: "${name}" points at unknown token "${value}" — emitted verbatim`);
      }
    }
    semantics.set(short, { css, source, figmaName: name });
  }
}

// ---------------------------------------------------------------- output ----
const byName = (a, b) => a[0].localeCompare(b[0], "en", { numeric: true });

function header(title, note) {
  const src = tokens._meta?.source;
  return [
    "/*",
    ` * ${title}`,
    " *",
    ` * AUTO-GENERATED from ${INPUT} by scripts/generate-tokens-css.mjs — do not edit by hand.`,
    src ? ` * Source: Figma "${src.fileName}" (${src.fileKey}), light mode.` : null,
    ` * ${note}`,
    " */",
    "",
  ]
    .filter((line) => line !== null)
    .join("\n");
}

const primitiveLines = [...primitives.entries()].sort(byName).map(([name, value]) => {
  const local = primitiveSource.get(name) === "local" ? " /* local */" : "";
  return `  --${name}: ${value};${local}`;
});

const semanticLines = [...semantics.entries()].sort(byName).map(([name, { css, source }]) => {
  const local = source === "local" ? " /* local */" : "";
  return `  --${name}: ${css};${local}`;
});

mkdirSync(OUTDIR, { recursive: true });

writeFileSync(
  join(OUTDIR, "primitives.css"),
  `${header(
    "Primitives — the raw palette.",
    "Do not reference these from components; use semantics.css instead.",
  )}:root {\n${primitiveLines.join("\n")}\n}\n`,
);

writeFileSync(
  join(OUTDIR, "semantics.css"),
  `${header(
    "Semantics — colour intent tokens.",
    'Requires primitives.css. Tokens tagged "local" come from this Figma file and override the corporate library.',
  )}@import "./primitives.css";\n\n:root {\n${semanticLines.join("\n")}\n}\n`,
);

// ---------------------------------------------------------------- report ----
const localSemantics = [...semantics.values()].filter((s) => s.source === "local").length;
const overrides = [...semantics.entries()].filter(
  ([name, s]) => s.source === "local" && renamedSemantics.corporate.has(name),
).length;

console.log(`${relative(process.cwd(), join(OUTDIR, "primitives.css"))}  ${primitives.size} tokens`);
console.log(`${relative(process.cwd(), join(OUTDIR, "semantics.css"))}   ${semantics.size} tokens (${localSemantics} local, ${overrides} overriding corporate)`);
if (warnings.length) {
  console.log("");
  for (const w of warnings) console.log(`warning: ${w}`);
}
