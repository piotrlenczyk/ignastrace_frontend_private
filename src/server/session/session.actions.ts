'use server';

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

/** Signs a visitor in against the new API. */
export const signIn = actionClient
  .inputSchema(signInSchema)
  .action(async ({ parsedInput }) => performSignIn(await cookies(), parsedInput));

/** Creates an account on the new API and signs it in. */
export const register = actionClient
  .inputSchema(registrationSchema)
  .action(async ({ parsedInput }) => performRegistration(await cookies(), parsedInput));

/**
 * Carries a changed email address into the session, so a profile edit does not
 * leave the member looking at a stale address — or signed out. The caller
 * refreshes the router afterwards to re-render with the rewritten cookie.
 */
export const updateSessionEmail = actionClient
  .inputSchema(sessionEmailSchema)
  .action(async ({ parsedInput }) => performEmailUpdate(await cookies(), parsedInput.email));

/** Ends the session: revoked upstream where possible, cleared locally always. */
export const signOut = actionClient.action(async () => performSignOut(await cookies()));
