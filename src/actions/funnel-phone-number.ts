'use server';

import { cookies } from 'next/headers';

import { apiServerClient } from '@/network/api/apiServerClient';
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

  const { error, data } = await apiServerClient['/api/v1/user/me'].GET();

  // TODO: [refactor] get onboarding phone number from new API
  void error;
  void data;
  // return data?.onboarding_phone_number ?? undefined;
  return undefined;
}
