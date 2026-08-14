'use server';

import { cookies } from 'next/headers';

import { getApi } from '@/libs/server/api';
import { getServerSession } from '@/server/session/session.utils';
import type { User } from '@/types/user';

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

  const api = await getApi();
  const user = await api.get<User>('/user');

  return user.onboarding_phone_number;
}
