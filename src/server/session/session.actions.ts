'use server';

import { cookies } from 'next/headers';

import {
  type Credentials,
  performEmailUpdate,
  performRegistration,
  performSignIn,
  performSignOut,
  type Registration,
  type RegistrationResult,
  type SignInResult,
} from './session.operations';

/**
 * Signs a visitor in against the new API. Returns the outcome rather than
 * throwing, so a form can render the failure without a round trip.
 */
export async function signIn(credentials: Credentials): Promise<SignInResult> {
  return performSignIn(await cookies(), credentials);
}

/**
 * Creates an account on the new API and signs it in. Like `signIn`, the outcome
 * comes back as a value so the form can show a taken address in place.
 */
export async function register(registration: Registration): Promise<RegistrationResult> {
  return performRegistration(await cookies(), registration);
}

/**
 * Carries a changed email address into the session, so a profile edit does not
 * leave the member looking at a stale address — or signed out. The caller
 * refreshes the router afterwards to re-render with the rewritten cookies.
 */
export async function updateSessionEmail(email: string): Promise<void> {
  await performEmailUpdate(await cookies(), email);
}

/** Ends the session: revoked upstream where possible, cleared locally always. */
export async function signOut(): Promise<void> {
  return performSignOut(await cookies());
}
