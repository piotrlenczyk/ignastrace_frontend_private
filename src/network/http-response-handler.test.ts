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
 * The payments service publishes no error response at all: every operation in
 * its specification declares a 200 or a 201 and nothing else, so unlike the API
 * above there is no generated schema to build a refusal from. Its envelope is
 * the framework default the service runs on — a message and the status restated
 * in the body — observed rather than declared.
 *
 * Restated here rather than taken from the parser's own `PaymentsApiErrorBody`,
 * which says the same thing: a test that builds its fixture out of the type
 * under test asserts only that the parser agrees with itself. This is the
 * independent statement of the shape, standing in for the generated schema the
 * API fixture above enjoys and this one does not.
 *
 * The 403 is the proxy's own refusal rather than the service's: the door in
 * front of the service answers in the same envelope, plus a code of its own, so
 * that a call that never left this application is tellable from one the service
 * turned down.
 */
type PaymentsOperation = {
  responses: {
    200: { content: { 'application/json': { id: string } } };
    402: { content: { 'application/json': { message: string; statusCode: number } } };
    403: { content: { 'application/json': { message: string; errorCode: string; statusCode: number } } };
    500: { content: { 'application/json': { message: string | null; statusCode: number } } };
  };
};

type PaymentsResult = FetchResponse<PaymentsOperation, unknown, 'application/json'>;
type PaymentsEnvelope = Extract<PaymentsResult, { error: unknown }>['error'];

/** What the generated client hands back when the payments service refuses a call. */
const paymentsRefusal = (status: number, error: PaymentsEnvelope): PaymentsResult => ({
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

  /*
   * The two parsers do not claim each other's bodies, which the assertions above
   * on `source` are the other half of: an API refusal stays an API refusal with
   * a second parser registered, and a payments refusal names the service that
   * sent it rather than falling through to a plain failure.
   */
  it('rejects a payments refusal as coming from the payments service', async () => {
    const error = await rejection(
      unwrapApiResponse(paymentsRefusal(402, { message: 'Card declined.', statusCode: 402 })),
    );

    expect(error).toBeInstanceOf(HttpClientError);
    /*
     * No `errorCode`: the service publishes none, so there is nothing to state.
     * The message is carried twice on purpose — as the message, and as the one
     * piece of context this envelope has to offer.
     */
    expect((error as HttpClientError).data).toEqual({
      message: 'Card declined.',
      code: '402',
      details: 'Card declined.',
      source: 'payments-api',
    });
    expect((error as HttpClientError).data.errorCode).toBeUndefined();
    expect((error as HttpClientError).response.status).toBe(402);
  });

  it("relays the payments proxy's own code, so a refusal by the door is tellable", async () => {
    const error = await rejection(
      unwrapApiResponse(
        paymentsRefusal(403, {
          message: 'That path is not published to the browser.',
          errorCode: 'PROXY_PATH_FORBIDDEN',
          statusCode: 403,
        }),
      ),
    );

    expect(error).toBeInstanceOf(HttpClientError);
    expect((error as HttpClientError).data).toEqual({
      message: 'That path is not published to the browser.',
      errorCode: 'PROXY_PATH_FORBIDDEN',
      code: '403',
      details: 'That path is not published to the browser.',
      source: 'payments-api',
    });
  });

  /*
   * The message is declared nullable on the shared envelope because the API
   * sends null on a 500, and a service that does the same is still refusing in
   * this envelope. There is then no context to carry across, so `details` is
   * absent rather than empty.
   */
  it('rejects a payments refusal that states no message', async () => {
    const error = await rejection(unwrapApiResponse(paymentsRefusal(500, { message: null, statusCode: 500 })));

    expect(error).toBeInstanceOf(HttpClientError);
    expect((error as HttpClientError).data).toEqual({ message: null, code: '500', source: 'payments-api' });
  });

  /*
   * The message is half of what identifies this envelope, so a body carrying
   * something else under that name is not this envelope. Falling through is the
   * point: a validation failure answering with a list of field messages is a
   * shape nothing here has been taught, and a plain failure says so — where
   * relaying the list as the message would have a form render an array.
   */
  it('rejects with a plain error when a payments-shaped body states no textual message', async () => {
    const error = await rejection(
      unwrapApiResponse(offSpecRefusal(400, { message: ['card must be present'], statusCode: 400 })),
    );

    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(HttpClientError);
  });

  /*
   * `errorCode`, unlike the message, is not part of what identifies the
   * envelope — it is this application's own addition at the door in front of the
   * service. A body carrying something else under that name is still a payments
   * refusal; the field simply is not the proxy's code, so it is not relayed as
   * one to a call site that would branch on it.
   */
  it('does not relay a payments errorCode that is not a code', async () => {
    const error = await rejection(
      unwrapApiResponse(offSpecRefusal(402, { message: 'Card declined.', errorCode: 42, statusCode: 402 })),
    );

    expect(error).toBeInstanceOf(HttpClientError);
    expect((error as HttpClientError).data).toEqual({
      message: 'Card declined.',
      code: '402',
      details: 'Card declined.',
      source: 'payments-api',
    });
  });

  /*
   * The two guards look in different places but neither excludes the other's
   * keys, so a body stating both is recognised by both and the registration
   * order decides. The API is registered first, and this is where that is
   * pinned: nothing else in the suite would notice the order being swapped.
   */
  it('reads a body satisfying both guards as the API, which is registered first', async () => {
    const error = await rejection(
      unwrapApiResponse(
        offSpecRefusal(500, {
          error: { message: 'Nope.', errorCode: 'INTERNAL_SERVER_ERROR', code: 'INTERNAL_SERVER_ERROR' },
          message: 'Nope.',
          statusCode: 500,
        }),
      ),
    );

    expect(error).toBeInstanceOf(HttpClientError);
    expect((error as HttpClientError).data.source).toBe('api');
  });

  it('rejects with a plain error when a body restates its status as something other than a number', async () => {
    const error = await rejection(
      unwrapApiResponse(offSpecRefusal(502, { message: 'Nope.', statusCode: 'BAD_GATEWAY' })),
    );

    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(HttpClientError);
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
