import type { schemas } from '@/network/api/apiServerClient';

import { isHttpClientActionError } from './safe-action';

/*
 * The SMS dispatch limit, read off the API's own error code.
 *
 * This is **not** the value the published specification carries. The
 * specification's error-code enumeration for that refusal —
 * `TooManyRequestsErrorCode` — collapsed onto its HTTP-status enumeration and came
 * out as `TOO_MANY_REQUESTS`, and the refusal is not declared on the dispatch
 * operation at all. What the backend actually emits is the shared business
 * enumeration's `TOO_MANY_REQUESTS_ERROR`, which is what a member's spent dispatch
 * budget has to be recognised by for the flow to work at all.
 *
 * Typed against the generated business enumeration, so a rename in the
 * specification fails the type check rather than quietly falling through to the
 * generic toast. The fix upstream is the specification declaring the refusal on the
 * dispatch operation with the code it really sends; until then this constant is the
 * one place that knows the difference.
 */
const DISPATCH_LIMIT_CODE: schemas['TooManyRequestsErrorCode'] = 'TOO_MANY_REQUESTS';

/**
 * Whether an action's `serverError` is the API refusing to dispatch an SMS because
 * the member has spent their budget for the current SMS dispatch cycle — the one
 * failure of this flow the compose screen can say something specific about.
 *
 * Read off the code and never off the status, per the data-layer rule: a status is
 * the transport's answer, and the same one covers refusals a member cannot act on.
 */
export const isDispatchLimitActionError = (serverError: unknown): boolean =>
  isHttpClientActionError(serverError) && serverError.data.errorCode === DISPATCH_LIMIT_CODE;
