import { describe, expect, it } from 'vitest';

import { parseCheckoutData } from './checkout-cookie';

/*
 * The cookie is written by the browser and read on the server render of the
 * screen where money changes hands, so the only thing worth asserting about it
 * is that nothing a browser can hold makes that render fail. Everything below
 * is input a hand-edited or truncated cookie can actually carry.
 */
describe('parseCheckoutData', () => {
  it('reads no attempt from a visitor arriving with no cookie', () => {
    expect(parseCheckoutData(undefined)).toBeNull();
  });

  it('reads no attempt from an empty value', () => {
    expect(parseCheckoutData('')).toBeNull();
  });

  it('reads no attempt from a truncated value, without throwing', () => {
    expect(() => parseCheckoutData('{"plan":"tri')).not.toThrow();
    expect(parseCheckoutData('{"plan":"tri')).toBeNull();
  });

  it('reads no attempt from valid JSON that is not an object', () => {
    expect(parseCheckoutData('"trial"')).toBeNull();
    expect(parseCheckoutData('null')).toBeNull();
  });

  it('reads no attempt from a plan the funnel does not offer', () => {
    expect(parseCheckoutData('{"plan":"FOUR_WEEKS_TRIAL"}')).toBeNull();
  });

  it('reads no attempt from a value carrying no plan', () => {
    expect(parseCheckoutData('{"currency":"EUR"}')).toBeNull();
  });

  it('reads the plan and the chosen currency', () => {
    expect(parseCheckoutData('{"plan":"subscription","currency":"EUR"}')).toEqual({
      plan: 'subscription',
      currency: 'EUR',
    });
  });

  it('reads an attempt whose visitor has not chosen a currency yet', () => {
    expect(parseCheckoutData('{"plan":"trial"}')).toEqual({ plan: 'trial' });
  });
});
