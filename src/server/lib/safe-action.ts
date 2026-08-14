import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from 'next-safe-action';

import { HttpClientError, type HttpClientErrorData } from '@/network/http-client-error';

/** A refusal from the API, as it survives the trip back to the browser. */
export type HttpClientActionError = {
  data: HttpClientErrorData;
  status: number;
};

/**
 * The one client every server action in this repository is built on. It exists
 * for a single job: turning the API's own refusal into something the form that
 * caused it can read, rather than a generic failure message.
 *
 * There is deliberately no session-requiring variant. An action that needs a
 * session calls the session getter itself, so that what an action requires is
 * visible in the action rather than in which client it was built from.
 */
export const actionClient = createSafeActionClient({
  handleServerError(error) {
    if (error instanceof HttpClientError) {
      return {
        data: error.data,
        status: error.response.status,
      } satisfies HttpClientActionError;
    }

    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
});

/**
 * Whether an action's `serverError` is a refusal from the API. The class is
 * gone by the time this runs — the error crossed the wire as plain data — so
 * the shape is what there is to check.
 */
export const isHttpClientActionError = (error: unknown): error is HttpClientActionError =>
  typeof error === 'object' &&
  error !== null &&
  'data' in error &&
  HttpClientError.isValidData(error.data) &&
  'status' in error &&
  typeof error.status === 'number';
