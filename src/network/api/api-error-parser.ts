import type { HttpClientErrorData } from '../http-client-error';
import type { HttpClientErrorParser } from '../http-client-error-parser';

/**
 * The body under the envelope's `error` key. Restated loosely rather than taken
 * from the generated schemas: the generated types describe what the API
 * promises, and a parser exists precisely for the case where what arrived is
 * something else.
 */
type ApiErrorBody = {
  message?: string | null;
  errorCode: string;
  code: string;
  details?: string[] | string;
  stacktrace?: string[];
};

/**
 * The new API's single error envelope: `{ error: { message, errorCode, code,
 * details, stacktrace } }`. The legacy backend keeps its own, unrelated error
 * type and does not come through here.
 */
export class ApiErrorParser implements HttpClientErrorParser {
  canHandle(data: unknown): data is { error: ApiErrorBody } {
    return typeof data === 'object' && data !== null && 'error' in data && this.isApiErrorBody(data.error);
  }

  parse(data: unknown): HttpClientErrorData | undefined {
    if (!this.canHandle(data)) {
      return undefined;
    }

    const { message, errorCode, code, details, stacktrace } = data.error;

    return { message, errorCode, code, details, stacktrace, source: 'api' };
  }

  getErrorMessage(data: unknown): string {
    return `API error: ${JSON.stringify({ data }, null, 2)}`;
  }

  private isApiErrorBody(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'errorCode' in error &&
      typeof error.errorCode === 'string' &&
      'code' in error &&
      typeof error.code === 'string'
    );
  }
}
