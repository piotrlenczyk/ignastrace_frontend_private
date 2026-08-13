'use server';

import { cookies } from 'next/headers';

import { type Credentials, performSignIn, performSignOut, type SignInResult } from './session.operations';

/**
 * Signs a visitor in against the new API. Returns the outcome rather than
 * throwing, so a form can render the failure without a round trip.
 */
export async function signIn(credentials: Credentials): Promise<SignInResult> {
  return performSignIn(await cookies(), credentials);
}

/** Ends the session: revoked upstream where possible, cleared locally always. */
export async function signOut(): Promise<void> {
  return performSignOut(await cookies());
}
