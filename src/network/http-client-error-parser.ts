import { ApiErrorParser } from './api/api-error-parser';
import type { HttpClientErrorData } from './http-client-error';

/** Turns one backend's error body into the shape `HttpClientError` carries. */
export type HttpClientErrorParser = {
  canHandle(data: unknown): boolean;
  parse(data: unknown): HttpClientErrorData | undefined;
  /** What to say when nothing could parse the body — it goes into a plain `Error`. */
  getErrorMessage(data: unknown): string;
};

/**
 * Tries the registered parsers in order and takes the first that recognises the
 * body. One is registered today; the list is what keeps a second backend's
 * envelope from being bolted onto the first parser when one arrives.
 */
export class HttpClientErrorParserManager {
  private static parsers: HttpClientErrorParser[] = [new ApiErrorParser()];

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
