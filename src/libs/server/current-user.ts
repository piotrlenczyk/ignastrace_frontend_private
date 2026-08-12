'use server';

import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { ROUTES } from '@/constants/routes';

export async function getCurrentUser() {
  const session = await auth();

  if (!session?.user) {
    redirect(ROUTES.SIGN_IN);
  }

  return session.user;
}
