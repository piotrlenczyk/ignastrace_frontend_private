/**
 * The new API's error envelope, flattened out of the `error` key it arrives
 * under. Every failure the specification declares — 400 through 500 — has this
 * shape, so one type describes them all.
 */
export type HttpClientErrorData = {
  /** Declared nullable upstream, so an absent message is a normal case. */
  message?: string | null;
  /** The API's own code for what went wrong; this is what a caller branches on. */
  errorCode: string;
  /** The HTTP status restated in the body, as a name rather than a number. */
  code: string;
  /** Sent only when the API runs with debugging on, which production does not. */
  stacktrace?: string[];
};

/**
 * A refusal from the new API, carrying both what the API said and the response
 * it said it in — the status lives on the response rather than being copied,
 * so there is one answer to "what came back" rather than two.
 */
export class HttpClientError extends Error {
  constructor(
    readonly data: HttpClientErrorData,
    readonly response: Response,
  ) {
    super(`HttpClientError: ${data.message ?? data.errorCode}`);
    this.name = 'HttpClientError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HttpClientError);
    }
  }

  /**
   * Whether something is the parsed data this error carries. Needed on the
   * client, where an action's failure arrives as a plain object that has been
   * through serialisation and no longer knows what class it came from.
   */
  static isValidData(data: unknown): data is HttpClientErrorData {
    return (
      typeof data === 'object' &&
      data !== null &&
      'errorCode' in data &&
      typeof data.errorCode === 'string' &&
      'code' in data &&
      typeof data.code === 'string'
    );
  }
}
