import { describe, expect, it } from 'vitest';

import messages from '@/locales/en.json';

import { REPORT_ENUM_FALLBACKS, REPORT_ENUM_LABELS } from './report-enum-labels';

/*
 * Every enumeration value the four report screens can render, walked against the
 * catalogue that has to carry a label for it.
 *
 * This is the one class of error in this migration the compiler cannot see. It
 * sees the other half: the resolvers in the module build their keys out of
 * `Lowercase<Value>`, so next-intl's typed messages check the key against the
 * English catalogue at build time. What it cannot check is the lists themselves
 * being complete — which is why `covering` fails the build when the specification
 * grows a value — nor a namespace whose keys have silently gone missing, which is
 * what this asserts.
 *
 * The lower-casing is restated here rather than imported, deliberately: what is
 * under test is the promise that a value the new API states in upper case reaches
 * the key the catalogues already hold in lower case. Reusing the module's own
 * helper would assert only that it agrees with itself.
 */

/** What the English catalogue holds at a dotted path, or nothing. */
const message = (path: string): unknown =>
  path
    .split('.')
    .reduce<unknown>(
      (node, part) => (typeof node === 'object' && node !== null ? (node as Record<string, unknown>)[part] : undefined),
      messages,
    );

const strandedValues = () =>
  REPORT_ENUM_LABELS.flatMap(({ namespace, group, values }) =>
    values
      .filter((value) => message(`${namespace}.${value.toLowerCase()}`) === undefined)
      .map((value) => ({ group, value: value as string })),
  );

describe('the labels the report screens resolve an enumeration to', () => {
  describe.each(REPORT_ENUM_LABELS)('$group', ({ namespace, values, group }) => {
    const throughFallback = new Set<string>(
      REPORT_ENUM_FALLBACKS.filter((fallback) => fallback.group === group).map((fallback) => fallback.value),
    );

    it.each(values.filter((value) => !throughFallback.has(value)))('resolves %s to a label', (value) => {
      expect(message(`${namespace}.${value.toLowerCase()}`)).toEqual(expect.any(String));
    });
  });

  it.each(REPORT_ENUM_FALLBACKS)('resolves $value through the copy this migration added', ({ namespace, key }) => {
    expect(message(`${namespace}.${key}`)).toEqual(expect.any(String));
  });

  it('reaches the added copy for exactly the values no catalogue has a key for', () => {
    expect(strandedValues()).toEqual(REPORT_ENUM_FALLBACKS.map(({ group, value }) => ({ group, value })));
  });
});
