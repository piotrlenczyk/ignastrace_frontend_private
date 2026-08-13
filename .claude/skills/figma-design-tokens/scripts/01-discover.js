// Step 1 — pass this file's contents as the `code` argument of use_figma.
// Seeds from local variables + variables bound on the current page, then walks the alias
// graph outward so indirectly-referenced collections (e.g. the primitives collection that
// semantic colors alias into) are found too.
// Returns a compact list of collections to classify by hand in step 2.

const collIds = new Set();

const localColls = await figma.variables.getLocalVariableCollectionsAsync();
localColls.forEach((c) => collIds.add(c.id));

// Sample bound variables off the page. Sampling (not exhaustive walking) is enough: we only
// need one variable per collection to unlock the whole collection in step 3.
const seedNodes = figma.currentPage.findAll((n) => n.boundVariables && Object.keys(n.boundVariables).length > 0);
const seedVarIds = new Set();
const step = Math.max(1, Math.floor(seedNodes.length / 1500));
for (let i = 0; i < seedNodes.length; i += step) {
  const bv = seedNodes[i].boundVariables;
  for (const k of Object.keys(bv)) {
    const e = bv[k];
    if (Array.isArray(e)) e.forEach((x) => x && x.id && seedVarIds.add(x.id));
    else if (e && e.id) seedVarIds.add(e.id);
  }
}
for (const id of seedVarIds) {
  const v = await figma.variables.getVariableByIdAsync(id);
  if (v) collIds.add(v.variableCollectionId);
}

// Text styles reference typography variables that may live in an otherwise unused collection.
const texts = figma.currentPage.findAllWithCriteria({ types: ['TEXT'] });
const styleIds = new Set();
for (const t of texts) if (typeof t.textStyleId === 'string' && t.textStyleId) styleIds.add(t.textStyleId);
for (const sid of styleIds) {
  const s = await figma.getStyleByIdAsync(sid);
  if (!s || !s.boundVariables) continue;
  for (const k of Object.keys(s.boundVariables)) {
    const e = s.boundVariables[k];
    if (!e || !e.id) continue;
    const v = await figma.variables.getVariableByIdAsync(e.id);
    if (v) collIds.add(v.variableCollectionId);
  }
}

// Expand through aliases until no new collection appears.
const out = [];
const seen = new Set();
const queue = Array.from(collIds);
while (queue.length) {
  const cid = queue.shift();
  if (seen.has(cid)) continue;
  seen.add(cid);
  const c = await figma.variables.getVariableCollectionByIdAsync(cid);
  if (!c) continue;

  const lightMode =
    c.modes.find((m) => /light/i.test(m.name)) || c.modes.find((m) => m.modeId === c.defaultModeId) || c.modes[0];

  const samples = [];
  for (const vid of c.variableIds.slice(0, 6)) {
    const v = await figma.variables.getVariableByIdAsync(vid);
    if (v) samples.push(v.name);
  }

  // Follow aliases from a slice of variables to discover upstream collections.
  for (const vid of c.variableIds.slice(0, 60)) {
    const v = await figma.variables.getVariableByIdAsync(vid);
    if (!v) continue;
    const raw = v.valuesByMode[lightMode.modeId];
    if (raw && typeof raw === 'object' && raw.type === 'VARIABLE_ALIAS') {
      const t = await figma.variables.getVariableByIdAsync(raw.id);
      if (t && !seen.has(t.variableCollectionId)) queue.push(t.variableCollectionId);
    }
  }

  out.push({
    id: c.id,
    name: c.name,
    remote: c.remote,
    modes: c.modes.map((m) => m.name),
    modeUsed: lightMode.name,
    count: c.variableIds.length,
    samples,
  });
}

return { seedNodes: seedNodes.length, textStyles: styleIds.size, collections: out };
