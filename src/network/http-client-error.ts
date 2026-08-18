/**
 * Which upstream refused. There are two, they answer in unrelated envelopes, and
 * a call site that cares which one said no has nothing else to branch on — the
 * status is shared and the codes overlap.
 *
 * It is also the discriminator the data guard checks, which is why the union is
 * written out here rather than left as a bare string: an upstream this
 * application does not have is not a refusal it can receive.
 */
export type HttpClientErrorSource = 'api' | 'payments-api';

const SOURCES: readonly HttpClientErrorSource[] = ['api', 'payments-api'];

/**
 * A refusal from an upstream, flattened out of whatever envelope it arrived in.
 * One type describes them all: every failure the API's specification declares —
 * 400 through 500 — has this shape once flattened, and a parser per upstream
 * brings the others to it.
 */
export type HttpClientErrorData = {
  /** Declared nullable upstream, so an absent message is a normal case. */
  message?: string | null;
  /**
   * The service's own code for what went wrong; this is what a caller branches
   * on. Optional because not every upstream publishes one — the payments
   * service answers with a message and a status and nothing more.
   */
  errorCode?: string;
  /**
   * The HTTP status restated in the body. A string because the API states it as
   * a name (`UNAUTHORIZED`); the payments service states the number, so for that
   * upstream it is the digits. Which of the two it is follows from `source`.
   */
  code: string;
  /**
   * Whatever extra context the service sent. A validation failure carries a
   * per-field message each; another failure may carry one descriptive string.
   * Absent when the service sent none, which is not the same as an empty one.
   */
  details?: string[] | string;
  /** Which upstream refused. Stated by the parser, never sent by a service. */
  source: HttpClientErrorSource;
  /** Sent only when the API runs with debugging on, which production does not. */
  stacktrace?: string[];
};

/**
 * A refusal from an upstream, carrying both what the service said and the
 * response it said it in — the status lives on the response rather than being
 * copied, so there is one answer to "what came back" rather than two.
 */
export class HttpClientError extends Error {
  constructor(
    readonly data: HttpClientErrorData,
    readonly response: Response,
  ) {
    super(`HttpClientError: ${data.message ?? data.errorCode ?? data.code}`);
    this.name = 'HttpClientError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HttpClientError);
    }
  }

  /**
   * Whether something is the parsed data this error carries. Needed on the
   * client, where an action's failure arrives as a plain object that has been
   * through serialisation and no longer knows what class it came from.
   *
   * The discriminator is what identifies it. No service sends `source`, so its
   * presence means the data went through a parser on this side of the hop —
   * which is a stronger claim than any field an upstream body could satisfy by
   * coincidence.
   */
  static isValidData(data: unknown): data is HttpClientErrorData {
    return (
      typeof data === 'object' &&
      data !== null &&
      'source' in data &&
      SOURCES.some((source) => source === data.source) &&
      'code' in data &&
      typeof data.code === 'string'
    );
  }
}
