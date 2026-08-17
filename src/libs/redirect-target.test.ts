import { describe, expect, it } from 'vitest';

import { resolveRedirectTarget, stripLocalePrefix } from './redirect-target';

const FALLBACK = '/checkout';

describe('resolveRedirectTarget', () => {
  it.each(['/memberarea/find-by-number', '/checkout?plan=subscription', '/es/memberarea/status', '/'])(
    'follows %s, which is a path on this site',
    (value) => {
      expect(resolveRedirectTarget(value, FALLBACK)).toBe(value);
    },
  );

  const rejected: [string | null, string][] = [
    ['//evil.example/phish', 'a protocol-relative URL'],
    ['/\\evil.example/phish', 'a backslash the browser reads as a slash'],
    ['https://evil.example', 'an absolute URL'],
    ['javascript:alert(1)', 'a script URL'],
    ['/ /evil.example', 'whitespace smuggled into the path'],
    ['memberarea', 'a path with no leading slash'],
    ['', 'an empty value'],
    [null, 'a missing parameter'],
  ];

  it.each(rejected)('falls back rather than follow %s (%s)', (value) => {
    expect(resolveRedirectTarget(value, FALLBACK)).toBe(FALLBACK);
  });
});

describe('stripLocalePrefix', () => {
  it('drops a leading locale segment', () => {
    expect(stripLocalePrefix('/es/memberarea/status')).toBe('/memberarea/status');
  });

  it('leaves a path that starts with something other than a locale alone', () => {
    expect(stripLocalePrefix('/memberarea/status')).toBe('/memberarea/status');
  });

  it('leaves a path whose first segment merely looks like a locale alone', () => {
    expect(stripLocalePrefix('/xx/memberarea')).toBe('/xx/memberarea');
  });

  it('turns a bare locale into the root path', () => {
    expect(stripLocalePrefix('/es')).toBe('/');
  });
});
