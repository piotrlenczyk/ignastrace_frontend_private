'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

import { actionClient } from '@/server/lib/safe-action';

import { performEmailUpdate, performRegistration, performSignIn, performSignOut } from './session.operations';
import { registrationSchema, sessionEmailSchema, signInSchema } from './session.schemas';

/*
 * The session's writes, as server actions on the one action client. They are
 * thin on purpose: everything that decides what lands in the cookie lives in
 * session.operations.ts, which is where it can be driven directly by a test.
 *
 * Sign-in and registration answer with an outcome rather than throwing, so a
 * form can render a refused password or a taken address in place. That outcome
 * arrives as the action's `data`; `serverError` stays reserved for a failure
 * nobody asked for.
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
export const signIn = actionClient.inputSchema(signInSchema).action(async ({ parsedInput }) => {
  const result = await performSignIn(await cookies(), parsedInput);

  revalidateRootLayout();

  return result;
});

/** Creates an account on the new API and signs it in. */
export const register = actionClient.inputSchema(registrationSchema).action(async ({ parsedInput }) => {
  const result = await performRegistration(await cookies(), parsedInput);

  revalidateRootLayout();

  return result;
});

/**
 * Carries a changed email address into the session, so a profile edit does not
 * leave the member looking at a stale address — or signed out. The caller
 * refreshes the router afterwards to re-render with the rewritten cookie.
 */
export const updateSessionEmail = actionClient
  .inputSchema(sessionEmailSchema)
  .action(async ({ parsedInput }) => performEmailUpdate(await cookies(), parsedInput.email));

/** Ends the session: revoked upstream where possible, cleared locally always. */
export const signOut = actionClient.action(async () => {
  await performSignOut(await cookies());

  revalidateRootLayout();
});
