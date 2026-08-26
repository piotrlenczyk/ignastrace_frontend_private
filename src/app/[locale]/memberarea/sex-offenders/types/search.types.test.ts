import { describe, expect, it } from 'vitest';

import { SEARCH_ALL_STATES, sexOffenderSearchBody } from './search.types';

/*
 * The request body a filled-in search form makes.
 *
 * The two names are required and always travel. The three filters are the whole
 * point of these cases: the upstream may distinguish an absent filter from an
 * empty one, so a field the member left alone is left out of the body rather
 * than narrowing the search to the empty string. The state control's sentinel
 * for "all states" — a word this application invented because a Radix
 * `Select.Item` throws on an empty value — resolves the same way, and never
 * reaches the API.
 */

const NAMES = { firstName: 'Mason', lastName: 'Hawthorne' };

describe('the body a sex-offender search posts', () => {
  it('sends the two names the form requires', () => {
    expect(sexOffenderSearchBody({ ...NAMES, state: SEARCH_ALL_STATES })).toMatchObject(NAMES);
  });

  it('sends the filters the member typed', () => {
    expect(sexOffenderSearchBody({ ...NAMES, city: 'Portland', state: 'OR', zipCode: '97205' })).toEqual({
      ...NAMES,
      city: 'Portland',
      state: 'OR',
      zipCode: '97205',
    });
  });

  /*
   * Serialised, because that is where the promise is kept: the fields are
   * `undefined` on the object and `JSON.stringify` is what drops them, so the
   * body that leaves this application carries the two names and nothing else.
   */
  it.each(['', undefined] as const)('omits a city, state and ZIP left as %p', (value) => {
    const body = sexOffenderSearchBody({ ...NAMES, city: value, state: value, zipCode: value });

    expect(JSON.parse(JSON.stringify(body))).toEqual(NAMES);
  });

  it('sends no state at all for “all states”', () => {
    expect(sexOffenderSearchBody({ ...NAMES, state: SEARCH_ALL_STATES }).state).toBeUndefined();
  });
});
