'use server';

import { cookies } from 'next/headers';
import type { User } from 'next-auth';

import { auth } from '@/auth';
import { getApi } from '@/libs/server/api';

export async function saveFunnelPhone(phoneNumber: string) {
  cookies().set('funnelPhoneNumber', phoneNumber);
}

export async function getFunnelPhone() {
  const cookiePhoneNumber = cookies().get('funnelPhoneNumber')?.value;

  if (cookiePhoneNumber) {
    return cookiePhoneNumber;
  }

  const session = await auth();

  if (!session) {
    return;
  }

  const api = await getApi();
  const user = await api.get<User>('/user');

  return user.onboarding_phone_number;
}
