'use server';

import { revalidatePath } from 'next/cache';

import { apiServerClient } from '@/network/api/apiServerClient';
import { unwrapApiResponse } from '@/network/http-response-handler';
import { actionClient } from '@/server/lib/safe-action';

import { registrationSchema, sessionEmailSchema, signInSchema } from '../session/session.schemas';
import { getSession, isUsableSession, setSession } from '../session/session.utils';

/*
 * The session's writes, as server actions on the one action client. Each one
 * makes its API call here and hands the pair it gets back to `setSession`, so
 * the answer to "what happens when someone signs in" is the body of the action
 * rather than a chain through a session module.
 *
 * Every call goes through the same generated client as the rest of the
 * application and is read through the shared unwrapper. None of the actions
 * answers with an outcome of its own: a refusal from the API propagates, and
 * the action client shapes it into a structured action error carrying the API's
 * envelope and status — the same channel every other API failure travels. A
 * form branches on the API's error code; anything that is not a refusal arrives
 * as the library's default server error.
 */

/*
 * The root layout renders the session provider out of the sealed cookie, so an
 * action that changes who is signed in has to invalidate it — otherwise the
 * client keeps the layout it already has and the tree goes on describing the
 * previous visitor. It is the layout and everything under it, because any page
 * may read the session.
 */
const revalidateRootLayout = () => revalidatePath('/', 'layout');

/** Signs a visitor in against the new API. */
export const actionSignIn = actionClient.inputSchema(signInSchema).action(async ({ parsedInput }) => {
  const { token, refreshToken } = await apiServerClient['/api/v1/auth/login']
    .POST({ body: parsedInput })
    .then(unwrapApiResponse);

  await setSession({ access: token, refresh: refreshToken });

  revalidateRootLayout();
});

/**
 * Creates an account on the new API and signs it in in the same step:
 * registration returns a token pair, so there is no reason to send someone who
 * has just typed their address back through a login form. The API issues the
 * password itself and mails it to the address, which is why there is nothing to
 * send beyond the email — the language that mail is written in comes from the
 * `x-locale` the client attaches from the request being served.
 */
export const actionRegister = actionClient.inputSchema(registrationSchema).action(async ({ parsedInput }) => {
  const { token, refreshToken } = await apiServerClient['/api/v1/auth/register']
    .POST({ body: parsedInput })
    .then(unwrapApiResponse);

  await setSession({ access: token, refresh: refreshToken });

  revalidateRootLayout();
});

/**
 * Carries a changed email address into the session, so a profile edit does not
 * leave the member looking at a stale address — or signed out. The token pair
 * is left exactly as it was: the address is identity, not authentication. The
 * caller refreshes the router afterwards to re-render with the rewritten cookie.
 */
export const actionUpdateSessionEmail = actionClient.inputSchema(sessionEmailSchema).action(async ({ parsedInput }) => {
  const session = await getSession();

  if (!isUsableSession(session)) {
    return;
  }

  session.user = { ...session.user, email: parsedInput.email };

  await session.save();
});

/** Ends the session. */
export const actionLogout = actionClient.action(async () => {
  const session = await getSession();

  session.destroy();

  revalidateRootLayout();
});
