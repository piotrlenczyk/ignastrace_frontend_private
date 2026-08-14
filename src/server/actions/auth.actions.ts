'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

import { actionClient } from '@/server/lib/safe-action';

import { performEmailUpdate, performRegistration, performSignIn, performSignOut } from '../session/session';
import { registrationSchema, sessionEmailSchema, signInSchema } from '../session/session.schemas';

/*
 * The session's writes, as server actions on the one action client. They are
 * thin on purpose: all each one does is hand the request's cookie jar to the
 * operation of the same name in session.ts, where everything that decides what
 * lands in the cookie lives.
 *
 * None of them answers with an outcome of its own. A refusal from the API
 * propagates, and the action client shapes it into a structured action error
 * carrying the API's envelope and status — the same channel every other API
 * failure in this application travels. A form branches on the API's error code;
 * anything that is not a refusal arrives as the library's default server error.
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
  await performSignIn(await cookies(), parsedInput);

  revalidateRootLayout();
});

/** Creates an account on the new API and signs it in. */
export const actionRegister = actionClient.inputSchema(registrationSchema).action(async ({ parsedInput }) => {
  await performRegistration(await cookies(), parsedInput);

  revalidateRootLayout();
});

/**
 * Carries a changed email address into the session, so a profile edit does not
 * leave the member looking at a stale address — or signed out. The caller
 * refreshes the router afterwards to re-render with the rewritten cookie.
 */
export const actionUpdateSessionEmail = actionClient
  .inputSchema(sessionEmailSchema)
  .action(async ({ parsedInput }) => performEmailUpdate(await cookies(), parsedInput.email));

/** Ends the session: revoked upstream where possible, cleared locally always. */
export const actionLogout = actionClient.action(async () => {
  await performSignOut(await cookies());

  revalidateRootLayout();
});
