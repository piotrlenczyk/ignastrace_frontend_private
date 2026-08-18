import { ApiErrorParser } from './api/api-error-parser';
import type { HttpClientErrorData } from './http-client-error';
import { PaymentsApiErrorParser } from './payments-api/payments-api-error-parser';

/** Turns one backend's error body into the shape `HttpClientError` carries. */
export type HttpClientErrorParser = {
  canHandle(data: unknown): boolean;
  parse(data: unknown): HttpClientErrorData | undefined;
  /** What to say when nothing could parse the body — it goes into a plain `Error`. */
  getErrorMessage(data: unknown): string;
};

/**
 * Tries the registered parsers in order and takes the first that recognises the
 * body. Both upstreams are registered, which is what the list was written for:
 * neither envelope was bolted onto the other's parser.
 *
 * The order is the tie-break, and it is load-bearing. The two guards look at
 * different places — the API at a nested `error` key, the payments service at a
 * message and a status at the top level — but neither excludes the other's keys,
 * so a body stating both satisfies both. The API goes first because its guard is
 * the one describing an envelope a service promises, where the other describes a
 * framework default that anything might answer with. A body satisfying neither
 * falls through to a plain failure.
 */
export class HttpClientErrorParserManager {
  private static parsers: HttpClientErrorParser[] = [new ApiErrorParser(), new PaymentsApiErrorParser()];

  static parse(data: unknown): HttpClientErrorData | undefined {
    for (const parser of this.parsers) {
      if (parser.canHandle(data)) {
        return parser.parse(data);
      }
    }

    return undefined;
  }

  static getErrorMessage(data: unknown): string {
    for (const parser of this.parsers) {
      if (parser.canHandle(data)) {
        return parser.getErrorMessage(data);
      }
    }

    return `HTTP Client error: ${JSON.stringify({ data }, null, 2)}`;
  }
}
