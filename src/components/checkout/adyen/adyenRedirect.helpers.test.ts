import { describe, expect, it } from 'vitest';

import { hasAdyenRedirectResult, isResumingAdyenRedirect } from './adyenRedirect.helpers';

/*
 * The trickiest condition in the reactivation dialog: whether the visitor in
 * front of it is a shopper coming back from a redirect-based 3-D Secure
 * challenge, and the island therefore has to be mounted for them without
 * anybody clicking anything.
 *
 * Both halves have to be there. The address alone is a stale link or a
 * hand-typed parameter, and the session storage alone is a challenge somebody
 * abandoned by navigating away — neither is a payment waiting to be finished,
 * and opening a payment dialog over either would be worse than doing nothing.
 */
describe('isResumingAdyenRedirect', () => {
  it('resumes when the challenge was started here and the address carries its result', () => {
    expect(isResumingAdyenRedirect({ redirectSource: 'card', redirectResult: 'eyJ0eXAiOiJK' })).toBe(true);
  });

  it('resumes a wallet challenge on the same two signals', () => {
    expect(isResumingAdyenRedirect({ redirectSource: 'googlePay', redirectResult: 'eyJ0eXAiOiJK' })).toBe(true);
  });

  it('does not resume for a visitor arriving with neither signal', () => {
    expect(isResumingAdyenRedirect({ redirectSource: null, redirectResult: null })).toBe(false);
  });

  it('does not resume on a redirect result alone, which no challenge here started', () => {
    expect(isResumingAdyenRedirect({ redirectSource: null, redirectResult: 'eyJ0eXAiOiJK' })).toBe(false);
  });

  it('does not resume on an abandoned challenge alone, which carries no result to submit', () => {
    expect(isResumingAdyenRedirect({ redirectSource: 'card', redirectResult: null })).toBe(false);
  });

  it('does not resume on an empty redirect result', () => {
    expect(isResumingAdyenRedirect({ redirectSource: 'card', redirectResult: '' })).toBe(false);
  });
});

/*
 * What a server render can tell about the same shopper: only what the address
 * says, because the recorded source lives in the browser. It decides one thing —
 * whether a checkout screen's redirect guards stand aside — so being wrong towards
 * "stand aside" is the harmless direction.
 */
describe('hasAdyenRedirectResult', () => {
  it('recognises a redirect result in the address', () => {
    expect(hasAdyenRedirectResult('eyJ0eXAiOiJK')).toBe(true);
  });

  it('recognises one arriving as a repeated parameter', () => {
    expect(hasAdyenRedirectResult(['eyJ0eXAiOiJK'])).toBe(true);
  });

  it('reads no redirect result from an address that carries none', () => {
    expect(hasAdyenRedirectResult(undefined)).toBe(false);
  });

  it('reads no redirect result from a parameter present but empty', () => {
    expect(hasAdyenRedirectResult('')).toBe(false);
    expect(hasAdyenRedirectResult([''])).toBe(false);
    expect(hasAdyenRedirectResult([])).toBe(false);
  });
});
