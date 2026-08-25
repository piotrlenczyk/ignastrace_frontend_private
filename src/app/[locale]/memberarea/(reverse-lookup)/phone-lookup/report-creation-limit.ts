import type { schemas } from '@/network/api/apiServerClient';
import { HttpClientErrorParserManager } from '@/network/http-client-error-parser';

/*
 * A spent report allowance, read off the API's own error code — the one refusal
 * this screen can say something a member can act on about.
 *
 * Two codes, because the specification and the backend do not agree which one
 * arrives and this module exists so that disagreement lives in one named place
 * rather than in a form. The report-creation operation declares only 401 and 403;
 * the rolling-window limit — five reports per 24 hours — is described in prose and
 * declared nowhere, so there is no generated error type for it to be found in.
 * What the generated types do carry is two plausible candidates: the dedicated
 * `TooManyRequestsErrorCode`, which collapsed onto its HTTP-status enumeration and
 * came out as `TOO_MANY_REQUESTS`, and the shared business enumeration's own
 * `TOO_MANY_REQUESTS_ERROR`. The SMS dispatch flow hit exactly this and picked one;
 * this accepts both, which is what makes establishing the answer unnecessary.
 *
 * Each constant is typed against the enumeration it comes from, so a rename in the
 * specification fails the type check rather than quietly dropping the member into
 * the generic "that number cannot be looked up" message. The fix upstream is the
 * specification declaring the refusal on the operation with the code it really
 * sends; until then this pair is the one place that knows the difference.
 */
const DEDICATED_CODE: schemas['TooManyRequestsErrorCode'] = 'TOO_MANY_REQUESTS';
const BUSINESS_CODE: schemas['BusinessErrorCode'] = 'TOO_MANY_REQUESTS_ERROR';

const LIMIT_CODES: readonly string[] = [DEDICATED_CODE, BUSINESS_CODE];

/**
 * Whether the API refused to create a report because the member has spent their
 * rolling daily allowance.
 *
 * What arrives here is the envelope the query hooks hand to `onError` — the body
 * the upstream refused with, deliberately unparsed, because a browser call is typed
 * to its operation rather than flattened. So the envelope is put through the same
 * parser the server-side layer reads a refusal with, rather than being taken apart
 * here: this refusal is the one the operation does not declare, so there is no
 * generated type to narrow it to, and restating the envelope's shape by hand would
 * be a second description of it. Whatever the parser does not recognise — a
 * gateway's HTML, a thrown error, nothing at all — answers with no code, which is
 * the screen's existing fallback.
 *
 * Read off the code and never off the status, per the data-layer rule: a status is
 * the transport's answer, and the same 429 covers refusals a member cannot act on.
 */
export const isReportLimitRefusal = (refusal: unknown): boolean => {
  const { errorCode } = HttpClientErrorParserManager.parse(refusal) ?? {};

  return errorCode !== undefined && LIMIT_CODES.includes(errorCode);
};
