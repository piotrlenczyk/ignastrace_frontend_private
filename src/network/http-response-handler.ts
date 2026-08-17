import { HttpClientError } from './http-client-error';
import { HttpClientErrorParserManager } from './http-client-error-parser';

/**
 * What the generated client resolves to. Restated structurally rather than
 * taken as `FetchResponse` from `openapi-fetch`: that type reaches its payload
 * through conditional and indexed lookups, so nothing can be inferred back out
 * of it and every caller would land on `unknown`. Spelling `data` out as a
 * plain property is what lets the generated response type survive the unwrap.
 */
type ApiFetchResult<Data> = {
  data?: Data;
  error?: unknown;
  response: Response;
};

/**
 * The interface callers use to read the generated client's result: the response
 * body on success, a rejection on anything from 400 up.
 *
 * A refusal the API described rejects with `HttpClientError`, carrying the
 * parsed envelope and the response. Anything else — a gateway's HTML, a proxy's
 * own JSON — rejects with a plain `Error`, because there is nothing structured
 * to hand a call site.
 */
export const unwrapApiResponse = async <Data>({ response, data, error }: ApiFetchResult<Data>): Promise<Data> => {
  if (response.status >= 400) {
    const errorData = HttpClientErrorParserManager.parse(error);

    if (errorData) {
      throw new HttpClientError(errorData, response);
    }

    throw new Error(HttpClientErrorParserManager.getErrorMessage(error));
  }

  return data as Data;
};
