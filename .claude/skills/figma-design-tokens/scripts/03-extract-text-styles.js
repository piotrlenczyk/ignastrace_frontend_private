// Step 3b — pass this file's contents as the `code` argument of use_figma.
// Text styles usually live in the shared library, so there is nothing local to enumerate.
// They are recovered from the TEXT nodes that use them, plus any local styles.
//
// Each style records both the literal typographic values and the typography *variables*
// bound to them. assemble.mjs prefers the variable names, because a style that says
// "font-size-text-md" survives a type-scale change while a style that says "16" does not.

const styles = new Map();

const local = await figma.getLocalTextStylesAsync();
for (const s of local) styles.set(s.id, s);

const texts = figma.currentPage.findAllWithCriteria({ types: ["TEXT"] });
for (const t of texts) {
  if (typeof t.textStyleId === "string" && t.textStyleId && !styles.has(t.textStyleId)) {
    const s = await figma.getStyleByIdAsync(t.textStyleId);
    if (s) styles.set(t.textStyleId, s);
  }
}

const rows = [];
for (const s of styles.values()) {
  const bound = {};
  if (s.boundVariables) {
    for (const k of Object.keys(s.boundVariables)) {
      const e = s.boundVariables[k];
      if (!e || !e.id) continue;
      const v = await figma.variables.getVariableByIdAsync(e.id);
      if (!v) continue;
      const c = await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId);
      bound[k] = { name: v.name, collection: c ? c.name : null };
    }
  }
  rows.push({
    name: s.name,
    remote: s.remote,
    fontFamily: s.fontName.family,
    fontStyle: s.fontName.style,
    fontSize: s.fontSize,
    lineHeight: s.lineHeight,
    letterSpacing: s.letterSpacing,
    paragraphSpacing: s.paragraphSpacing,
    textCase: s.textCase,
    textDecoration: s.textDecoration,
    bound,
  });
}

return { textNodes: texts.length, count: rows.length, rows };
