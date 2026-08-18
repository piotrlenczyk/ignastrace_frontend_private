'use client';

import { $api } from '../api-browser-client';

/**
 * Asks the API to mail a new password to an address.
 *
 * A mutation rather than a server action: nothing here writes a cookie, redirects
 * or invalidates a render — the visitor is not signed in before the call and is
 * not signed in after it. The operation sits under the API's authentication
 * prefix but issues no session, which is why the proxy forwards it while
 * refusing its neighbours.
 *
 * The API answers 200 whatever address it is given, deliberately: telling a
 * registered address from an unregistered one would turn this form into a way of
 * finding out who has an account. So there is no success to read and no refusal
 * to branch on — a failure reaching `onError` is the network or the API being
 * down, not a verdict on the address.
 */
export const useForgotPasswordMutation = () => $api.useMutation('post', '/api/v1/auth/forgot-password');
