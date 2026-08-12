// Step 3 — pass this file's contents as the `code` argument of use_figma, ONE COLLECTION
// PER CALL. Edit COLLECTION_ID below; use OFFSET/LIMIT only if a single collection's
// response gets truncated (~20 kB), then concatenate the slices.
//
// Emits compact rows so a whole collection fits in one response:
//   [name, kind, value]
//     kind "v" -> value is the raw value (hex string for colors, number/string otherwise)
//     kind "a" -> value is the *name* of the variable this one aliases

const COLLECTION_ID = "PASTE_COLLECTION_ID_HERE";
const OFFSET = 0;
const LIMIT = 1000;

const c = await figma.variables.getVariableCollectionByIdAsync(COLLECTION_ID);
if (!c) throw new Error("Collection not found: " + COLLECTION_ID);

const lightMode =
  c.modes.find((m) => /light/i.test(m.name)) ||
  c.modes.find((m) => m.modeId === c.defaultModeId) ||
  c.modes[0];

const hex = (n) =>
  Math.round(Math.max(0, Math.min(1, n)) * 255)
    .toString(16)
    .padStart(2, "0");
const toHex = (col) => {
  const base = "#" + hex(col.r) + hex(col.g) + hex(col.b);
  return col.a === undefined || col.a >= 1 ? base : base + hex(col.a);
};

const ids = c.variableIds.slice(OFFSET, OFFSET + LIMIT);
const rows = [];
for (const vid of ids) {
  const v = await figma.variables.getVariableByIdAsync(vid);
  if (!v) continue;
  const raw = v.valuesByMode[lightMode.modeId];

  if (raw && typeof raw === "object" && raw.type === "VARIABLE_ALIAS") {
    const t = await figma.variables.getVariableByIdAsync(raw.id);
    rows.push([v.name, "a", t ? t.name : null]);
  } else if (raw && typeof raw === "object" && "r" in raw) {
    rows.push([v.name, "v", toHex(raw)]);
  } else {
    rows.push([v.name, "v", raw]);
  }
}

return {
  collection: c.name,
  collectionId: c.id,
  remote: c.remote,
  modeUsed: lightMode.name,
  total: c.variableIds.length,
  offset: OFFSET,
  returned: rows.length,
  rows,
};
