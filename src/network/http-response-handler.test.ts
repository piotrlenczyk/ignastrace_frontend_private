import type { FetchResponse } from 'openapi-fetch';
import { describe, expect, it } from 'vitest';

import type { components } from './api/api';
import { HttpClientError } from './http-client-error';
import { unwrapApiResponse } from './http-response-handler';

/*
 * A stand-in operation declaring every error status the specification uses,
 * alongside a success. It is written against the generated schemas rather than
 * by hand, so an envelope that changes shape upstream fails here rather than at
 * runtime.
 */
type Operation = {
  responses: {
    200: { content: { 'application/json': { id: string } } };
    400: { content: { 'application/json': components['schemas']['BadRequestErrorResponseSchema'] } };
    401: { content: { 'application/json': components['schemas']['UnauthorizedErrorResponseSchema'] } };
    403: { content: { 'application/json': components['schemas']['ForbiddenErrorResponseSchema'] } };
    404: { content: { 'application/json': components['schemas']['NotFoundErrorResponseSchema'] } };
    409: { content: { 'application/json': components['schemas']['ConflictErrorResponseSchema'] } };
    429: { content: { 'application/json': components['schemas']['TooManyRequestsErrorResponseSchema'] } };
    500: { content: { 'application/json': components['schemas']['InternalServerErrorResponseSchema'] } };
  };
};

type Result = FetchResponse<Operation, unknown, 'application/json'>;
type Envelope = Extract<Result, { error: unknown }>['error'];

/** What the generated client hands back when the API refuses a call. */
const refusal = (status: number, error: Envelope): Result => ({
  error,
  response: new Response(JSON.stringify(error), { status }),
});

/*
 * The same, for a body the envelope does not describe — a gateway's HTML, say,
 * or a proxy's own JSON. The operation is deliberately looser than the one
 * above, because such a body is by definition off-specification.
 */
type UnspecifiedOperation = {
  responses: {
    200: { content: { 'application/json': { id: string } } };
    502: { content: { 'application/json': unknown } };
  };
};

const offSpecRefusal = (
  status: number,
  error: unknown,
): FetchResponse<UnspecifiedOperation, unknown, 'application/json'> => ({
  error,
  response: new Response(String(error), { status }),
});

/*
 * One refusal per status the specification declares. Each body is checked
 * against its own generated schema, so an error code that is not in the enum
 * for that status does not compile.
 */
const REFUSALS: [number, Envelope][] = [
  [
    400,
    { error: { message: 'Nope.', errorCode: 'VALIDATION_ERROR', code: 'BAD_REQUEST', details: [], stacktrace: [] } },
  ],
  [401, { error: { message: 'Nope.', errorCode: 'TOKEN_EXPIRED', code: 'UNAUTHORIZED', details: [], stacktrace: [] } }],
  [
    403,
    {
      error: {
        message: 'Nope.',
        errorCode: 'INSUFFICIENT_PERMISSIONS',
        code: 'FORBIDDEN',
        details: [],
        stacktrace: [],
      },
    },
  ],
  [
    404,
    {
      error: { message: 'Nope.', errorCode: 'ENTITY_NOT_FOUND_ERROR', code: 'NOT_FOUND', details: [], stacktrace: [] },
    },
  ],
  [409, { error: { message: 'Nope.', errorCode: 'USER_EXISTS_ERROR', code: 'CONFLICT', details: [], stacktrace: [] } }],
  [
    429,
    {
      error: {
        message: 'Nope.',
        errorCode: 'TOO_MANY_REQUESTS',
        code: 'TOO_MANY_REQUESTS',
        details: [],
        stacktrace: [],
      },
    },
  ],
  [
    500,
    {
      error: {
        message: null,
        errorCode: 'INTERNAL_SERVER_ERROR',
        code: 'INTERNAL_SERVER_ERROR',
        details: [],
        stacktrace: [],
      },
    },
  ],
];

/** Whatever the unwrap rejected with, so a test can assert on it. */
const rejection = async (unwrapped: Promise<unknown>): Promise<unknown> =>
  unwrapped.then(
    () => undefined,
    (thrown: unknown) => thrown,
  );

describe('unwrapApiResponse', () => {
  it('returns the body of a successful response', async () => {
    const result: Result = {
      data: { id: 'abc' },
      response: new Response(JSON.stringify({ id: 'abc' }), { status: 200 }),
    };

    // Annotated, not inferred: the generated response type surviving the
    // unwrap is the point of the whole layer, so it is asserted at compile time.
    const body: { id: string } = await unwrapApiResponse(result);

    expect(body).toEqual({ id: 'abc' });
  });

  it.each(REFUSALS)('rejects a %i with the envelope it carried', async (status, envelope) => {
    const error = await rejection(unwrapApiResponse(refusal(status, envelope)));
    const { message, errorCode, code, details, stacktrace } = envelope.error;

    expect(error).toBeInstanceOf(HttpClientError);
    /*
     * The fields the flattened error is declared to carry, rather than the
     * envelope entire: the parser picks what it recognises, so a field the API
     * adds upstream is not relayed until this layer is taught about it. Asserting
     * on equality with the whole envelope would make every such addition a
     * failure here, and the addition is the API's business, not this layer's.
     *
     * `source` is not in the envelope and never will be — it says which upstream
     * refused, which only this side of the hop knows.
     */
    expect((error as HttpClientError).data).toEqual({ message, errorCode, code, details, stacktrace, source: 'api' });
    expect((error as HttpClientError).response.status).toBe(status);
  });

  it('rejects with a plain error when the body is not the API envelope', async () => {
    const error = await rejection(unwrapApiResponse(offSpecRefusal(502, '<html>Bad gateway</html>')));

    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(HttpClientError);
    expect((error as Error).message).toContain('Bad gateway');
  });

  it('rejects with a plain error when the envelope is missing its codes', async () => {
    const error = await rejection(unwrapApiResponse(offSpecRefusal(502, { error: { message: 'Nope.' } })));

    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(HttpClientError);
  });
});
