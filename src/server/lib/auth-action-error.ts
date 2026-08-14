import type { components } from '@/network/api/api';

import { isHttpClientActionError } from './safe-action';

type BusinessErrorCode = components['schemas']['BusinessErrorCode'];

/*
 * The registration conflict, read off the API's own error code rather than off
 * a status. The specification declares one code for a conflict on the
 * registration operation; the shared business enumeration carries a second name
 * for the same condition, and both are accepted so that the address field keeps
 * getting the message it gets today whichever one the deployment answers with.
 *
 * Typed against the generated enumeration, so a rename in the specification
 * fails the type check rather than quietly falling through to the generic toast.
 */
const EMAIL_TAKEN_CODES: readonly BusinessErrorCode[] = ['USER_EXISTS_ERROR', 'EMAIL_EXISTS_ERROR'];

/**
 * Whether an action's `serverError` is the API refusing a registration because
 * the address already has an account — the one auth refusal a form can point at
 * a single field.
 */
export const isEmailTakenActionError = (serverError: unknown): boolean =>
  isHttpClientActionError(serverError) && EMAIL_TAKEN_CODES.some((code) => code === serverError.data.errorCode);
