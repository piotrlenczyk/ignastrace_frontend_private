import type { HttpClientErrorData } from '../http-client-error';
import type { HttpClientErrorParser } from '../http-client-error-parser';

/**
 * The payments service's error body. Written out here rather than taken from the
 * generated specification because the specification has none: every operation it
 * publishes declares a 200 or a 201 and no failure at all. This is the framework
 * default the service runs on — a message and the status restated in the body —
 * observed rather than promised, which is exactly the case a parser exists for.
 *
 * `errorCode` is not the service's. The proxy in front of it refuses in this same
 * envelope and adds one, so that a call this application turned down at the door
 * is tellable from one the service turned down.
 */
type PaymentsApiErrorBody = {
  message: string | null;
  errorCode?: unknown;
  statusCode: number;
};

/**
 * The payments service's refusals, flattened into the shared envelope.
 *
 * The status is restated as `code`, as a number in a string: the API's `code` is
 * a name because the API sends a name, and this service sends a number. A call
 * site reading either has the status on the response anyway; `code` is what
 * survives the trip to a form.
 *
 * The message is carried twice — as the message, and as `details` — because it is
 * the only context this envelope carries, and a form that renders detail should
 * not have to know that for this upstream the detail lives in the message.
 */
export class PaymentsApiErrorParser implements HttpClientErrorParser {
  /**
   * A message and a restated status, both of the declared type. The message is
   * checked rather than merely present because it is half of what identifies
   * this envelope and all of what a form renders: a body answering with a list
   * of field messages under that name is a shape this parser has not been taught
   * and should fall through, not be relayed as a message that is not one.
   *
   * What this recognises is a framework's default, not a service's promise, and
   * the parser manager is shared by both upstreams and told by neither which one
   * it is reading. So an off-specification body of this shape returned on the
   * API's own path — a gateway's, a middlebox's — is labelled as this service's.
   * It is the price of the only envelope this upstream has: the alternative is
   * refusing to parse it at all, which loses the one message a form could show.
   * Narrowing it means telling the manager which client is asking, which is a
   * wider change than the envelope's own parser can make.
   */
  canHandle(data: unknown): data is PaymentsApiErrorBody {
    return (
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      (typeof data.message === 'string' || data.message === null) &&
      'statusCode' in data &&
      typeof data.statusCode === 'number'
    );
  }

  parse(data: unknown): HttpClientErrorData | undefined {
    if (!this.canHandle(data)) {
      return undefined;
    }

    const { message, errorCode, statusCode } = data;

    /*
     * `errorCode` is stated only when the body carried one, which for this
     * upstream means the proxy refused rather than the service. The service
     * publishes no codes, so for a refusal that reached it the field is absent —
     * which is why the envelope declares it optional. Relaying it when it is
     * there is what keeps the project's rule of branching on the code rather
     * than the status available on this upstream too.
     *
     * Unlike the message, it is not part of what identifies the envelope: a body
     * carrying something other than a code under that name is still a payments
     * refusal, so it is dropped rather than being grounds to refuse the body.
     */
    return {
      message,
      ...(typeof errorCode === 'string' ? { errorCode } : {}),
      code: statusCode.toString(),
      details: message ?? undefined,
      source: 'payments-api',
    };
  }

  getErrorMessage(data: unknown): string {
    return `Payments API error: ${JSON.stringify({ data }, null, 2)}`;
  }
}
