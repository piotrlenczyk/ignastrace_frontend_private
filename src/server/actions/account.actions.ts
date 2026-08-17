'use server';

import { apiServerClient } from '@/network/api/apiServerClient';
import { unwrapApiResponse } from '@/network/http-response-handler';
import { actionClient } from '@/server/lib/safe-action';

import { getSession, setSessionEmail } from '../session/session.utils';
import { updateAccountSchema } from './account.schemas';

/*
 * The settings screen's two writes, as server actions on the one action client.
 *
 * Both are actions rather than query-library mutations for the same reason: each
 * has to rewrite the sealed session, which only a server can open. A refusal
 * propagates and the action client shapes it into a structured action error
 * carrying the API's own envelope, so the form branches on the API's error code
 * and never on an HTTP status.
 */

/**
 * A profile edit, and the password change the same form may carry.
 *
 * The new API splits what the legacy aggregate accepted in one call, so this runs
 * two requests — and the order is the point. A wrong current password is by far
 * the most common refusal on this screen, and verifying it first means that
 * refusal leaves nothing saved. The residual case is the other order: a password
 * that changed and a profile the API then refused. There is no rollback for it,
 * so it must not be reported as a success — the profile refusal propagates and
 * the form says so.
 *
 * The session's address is rewritten last, once the API has accepted the new one.
 * The token pair is left as it was: the address is identity, not authentication,
 * so the member stays signed in and the caller refreshes to re-render from the
 * rewritten cookie.
 */
export const actionUpdateAccount = actionClient.inputSchema(updateAccountSchema).action(async ({ parsedInput }) => {
  const { name, email, currentPassword, newPassword } = parsedInput;

  if (currentPassword && newPassword) {
    await apiServerClient['/api/v1/user/me/password']
      .POST({ body: { oldPassword: currentPassword, newPassword } })
      .then(unwrapApiResponse);
  }

  await apiServerClient['/api/v1/user'].PUT({ body: { name, email } }).then(unwrapApiResponse);

  await setSessionEmail(email);
});

/**
 * Ends the account, and the session with it — no credential outlives the account
 * it belonged to.
 *
 * Deliberately no redirect: the dialog that asked for this shows a confirmation
 * on success and navigates home when it is closed, and a redirect here would take
 * the confirmation off the screen before it had been read.
 */
export const actionDeleteAccount = actionClient.action(async () => {
  await apiServerClient['/api/v1/user/me/delete'].DELETE().then(unwrapApiResponse);

  const session = await getSession();

  session.destroy();
});
