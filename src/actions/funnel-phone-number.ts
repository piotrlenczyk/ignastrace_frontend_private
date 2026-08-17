'use server';

import { cookies } from 'next/headers';

import { getUser } from '@/libs/subscription';
import { getServerSession } from '@/server/session/session.utils';

export async function saveFunnelPhone(phoneNumber: string) {
  (await cookies()).set('funnelPhoneNumber', phoneNumber);
}

export async function getFunnelPhone() {
  const cookiePhoneNumber = (await cookies()).get('funnelPhoneNumber')?.value;

  if (cookiePhoneNumber) {
    return cookiePhoneNumber;
  }

  const session = await getServerSession();

  if (!session) {
    return;
  }

  const member = await getUser();

  return member.onboarding_phone_number || undefined;
}
