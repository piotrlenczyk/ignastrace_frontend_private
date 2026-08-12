import { getEnabledLocaleCodes } from './config';

describe('getEnabledLocaleCodes', () => {
  it('returns version 1 locales', () => {
    expect(getEnabledLocaleCodes(1)).toEqual([
      'en',
      'es',
      'pt',
      'fr',
      'de',
      'it',
      'nl',
      'no',
      'pl',
      'sv',
      'tr',
      'ro',
      'da',
    ]);
  });

  it('returns version 2 locales', () => {
    expect(getEnabledLocaleCodes(2)).toContain('id');
    expect(getEnabledLocaleCodes(2)).not.toContain('cs');
  });

  it('returns version 3 locales', () => {
    expect(getEnabledLocaleCodes(3)).toEqual(expect.arrayContaining(['cs', 'hr', 'el', 'sk']));
  });
});
