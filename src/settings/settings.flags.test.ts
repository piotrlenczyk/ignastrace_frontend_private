import { describe, expect, it } from 'vitest';

import { isFlagOn, resolveFlag } from './settings.flags';

describe('isFlagOn', () => {
  it('reads the dialect this repository deploys', () => {
    expect(isFlagOn('true')).toBe(true);
  });

  it('reads the dialect the resumewise configuration uses', () => {
    expect(isFlagOn('1')).toBe(true);
  });

  it('ignores the case of the spelled-out dialect', () => {
    expect(isFlagOn('TRUE')).toBe(true);
    expect(isFlagOn('True')).toBe(true);
  });

  it('is off when the variable is unset', () => {
    expect(isFlagOn(undefined)).toBe(false);
  });

  it('is off for either spelling of off', () => {
    expect(isFlagOn('0')).toBe(false);
    expect(isFlagOn('false')).toBe(false);
  });

  it('is off for anything it does not recognise, rather than guessing', () => {
    expect(isFlagOn('')).toBe(false);
    expect(isFlagOn('yes')).toBe(false);
    expect(isFlagOn('on')).toBe(false);
  });
});

describe('resolveFlag', () => {
  it('takes the source when no override cookie is present', () => {
    expect(resolveFlag({ override: undefined, source: true })).toBe(true);
    expect(resolveFlag({ override: undefined, source: false })).toBe(false);
  });

  it('turns a flag on over a source that says otherwise', () => {
    expect(resolveFlag({ override: '1', source: false })).toBe(true);
    expect(resolveFlag({ override: 'true', source: false })).toBe(true);
  });

  it('turns a flag off over a source that says otherwise', () => {
    expect(resolveFlag({ override: '0', source: true })).toBe(false);
    expect(resolveFlag({ override: 'false', source: true })).toBe(false);
  });

  it('falls back to the source when the cookie says something it cannot read', () => {
    expect(resolveFlag({ override: 'maybe', source: true })).toBe(true);
    expect(resolveFlag({ override: '', source: true })).toBe(true);
    expect(resolveFlag({ override: 'maybe', source: false })).toBe(false);
  });
});
