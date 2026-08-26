'use server';

import { cookies } from 'next/headers';

import { getUser } from '@/libs/subscription';
import { getServerSession } from '@/server/session/session.utils';

export async function saveFunnelPhone(phoneNumber: string) {
  (await cookies()).set('funnelPhoneNumber', phoneNumber);
}

/**
 * The number the funnel works with: the one typed into this run first, and the
 * one supplied at signup second.
 *
 * The precedence is the point — a visitor who has just typed a number is asking
 * about that number, whatever their account says — and it is unchanged. What
 * changed is where the second answer comes from: the account service publishes
 * `onboardingPhoneNumber` and it is read directly, where it used to arrive
 * through a composed member whose value for it was a fixture's.
 *
 * The account holds `null` where nothing parseable was supplied at signup, and a
 * caller is told the same thing it was told before: nothing is known.
 */
export async function getFunnelPhone() {
  const cookiePhoneNumber = (await cookies()).get('funnelPhoneNumber')?.value;

  if (cookiePhoneNumber) {
    return cookiePhoneNumber;
  }

  const session = await getServerSession();

  if (!session) {
    return;
  }

  const account = await getUser();

  return account.onboardingPhoneNumber || undefined;
}
