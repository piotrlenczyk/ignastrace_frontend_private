import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

import baseConfig, { ratchetConfig } from './eslint.config.mjs';

/*
 * ADR 0003 records that this machinery fails quietly rather than loudly: if the
 * Tailwind entry point stops resolving, or a rule stops being attached, or an
 * option is renamed under the plugin, the rules report nothing and everything
 * still looks green. A test that inspected the config object would go green
 * alongside them, so this one runs ESLint itself and reads what it reports.
 *
 * The path below stands in for a route that has been rebuilt against the Figma
 * design — the ratchet only binds inside such a path, and MIGRATED_PATHS is
 * empty until the first one lands. No brackets in it: `files` patterns are
 * globs, and `[locale]` would be read as a character class.
 */
const REDESIGNED_FILE = 'src/app/redesigned/page.tsx';
const UNTOUCHED_FILE = 'src/app/legacy/page.tsx';

const RULE = 'better-tailwindcss/no-restricted-classes';

const eslint = new ESLint({
  overrideConfigFile: true,
  overrideConfig: [...baseConfig, ...ratchetConfig([REDESIGNED_FILE])],
});

const restrictedClassesIn = async (className: string, filePath = REDESIGNED_FILE) => {
  const [result] = await eslint.lintText(
    `export default function Page() {\n  return <div className="${className}" />;\n}\n`,
    { filePath },
  );

  return (result?.messages ?? []).filter(message => message.ruleId === RULE);
};

describe('the redesign ratchet', () => {
  it('reports a retiring colour token inside a redesigned path', async () => {
    const messages = await restrictedClassesIn('bg-primary');

    expect(messages).toHaveLength(1);
    expect(messages[0]?.message).toContain('retiring palette');
  });

  it('reports a retiring text size inside a redesigned path', async () => {
    const messages = await restrictedClassesIn('text-sm');

    expect(messages).toHaveLength(1);
    expect(messages[0]?.message).toContain('retiring type scale');
  });

  it('sees through variants, modifiers and the important marker', async () => {
    // The anchors are the fiddly part of the pattern and the easiest thing to
    // get quietly wrong: an anchor that stops at the bare utility name lets
    // every one of these through without a word.
    expect(await restrictedClassesIn('hover:bg-primary')).toHaveLength(1);
    expect(await restrictedClassesIn('bg-primary/50')).toHaveLength(1);
    expect(await restrictedClassesIn('text-sm!')).toHaveLength(1);
    expect(await restrictedClassesIn('md:hover:text-sm/6')).toHaveLength(1);
  });

  it('says nothing about the new intent tokens and text styles', async () => {
    expect(await restrictedClassesIn('bg-bg-brand-solid')).toHaveLength(0);
    expect(await restrictedClassesIn('text-text-primary')).toHaveLength(0);
    expect(await restrictedClassesIn('border-border-secondary')).toHaveLength(0);
    expect(await restrictedClassesIn('text-display-xl-medium')).toHaveLength(0);
    // `text-body` is retiring and `font-body` replaces it — one hyphen apart,
    // which is why the colour prefixes are enumerated rather than matched.
    expect(await restrictedClassesIn('font-body')).toHaveLength(0);
  });

  it('leaves files outside a redesigned path alone', async () => {
    // Everywhere else the old names are still the only ones the page is written
    // in, so the ratchet has nothing to say there.
    expect(await restrictedClassesIn('bg-primary', UNTOUCHED_FILE)).toHaveLength(0);
    expect(await restrictedClassesIn('text-sm', UNTOUCHED_FILE)).toHaveLength(0);
  });
});
