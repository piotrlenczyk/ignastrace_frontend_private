import { describe, expect, it } from 'vitest';

import { HttpClientErrorParserManager } from '@/network/http-client-error-parser';

import { isHttpClientActionError } from './safe-action';

/*
 * What a form actually receives: the action client's `serverError`, which
 * crossed the wire as plain data and no longer knows what class it came from.
 * Built from the parser rather than by hand, so a discriminator the parser stops
 * stating fails here rather than at a form.
 */
const asServerError = (body: unknown, status: number): unknown => ({
  data: HttpClientErrorParserManager.parse(body),
  status,
});

describe('isHttpClientActionError', () => {
  it("recognises a refusal parsed out of the API's envelope", () => {
    const serverError = asServerError(
      { error: { message: 'Nope.', errorCode: 'CREDENTIALS_ERROR', code: 'UNAUTHORIZED', details: [] } },
      401,
    );

    expect(isHttpClientActionError(serverError)).toBe(true);
  });

  /*
   * The discriminator is what the guard checks, so a second upstream's refusal
   * is recognised on the same channel — the point of widening the envelope.
   */
  it('recognises a refusal that names the payments service', () => {
    const serverError = { data: { message: 'Nope.', code: 'BAD_REQUEST', source: 'payments-api' }, status: 400 };

    expect(isHttpClientActionError(serverError)).toBe(true);
  });

  it('rejects data that names no upstream', () => {
    const serverError = {
      data: { message: 'Nope.', errorCode: 'CREDENTIALS_ERROR', code: 'UNAUTHORIZED' },
      status: 401,
    };

    expect(isHttpClientActionError(serverError)).toBe(false);
  });

  it('rejects data that names an upstream this application does not have', () => {
    const serverError = { data: { message: 'Nope.', code: 'BAD_REQUEST', source: 'billing-api' }, status: 400 };

    expect(isHttpClientActionError(serverError)).toBe(false);
  });

  it('rejects a generic failure message', () => {
    expect(isHttpClientActionError('Something went wrong.')).toBe(false);
  });

  it('rejects a refusal carrying no status', () => {
    const serverError = { data: { message: 'Nope.', code: 'UNAUTHORIZED', source: 'api' } };

    expect(isHttpClientActionError(serverError)).toBe(false);
  });
});
