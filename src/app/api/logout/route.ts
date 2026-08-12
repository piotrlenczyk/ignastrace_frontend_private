import { redirect } from 'next/navigation';

import { signOut } from '@/auth';
import { ROUTES } from '@/constants/routes';

export async function GET() {
  await signOut({ redirect: false });

  redirect(ROUTES.SIGN_IN);
}
