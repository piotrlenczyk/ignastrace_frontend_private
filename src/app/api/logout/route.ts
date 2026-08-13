import { redirect } from 'next/navigation';

import { ROUTES } from '@/constants/routes';
import { signOut } from '@/server/session/session.actions';

/*
 * A thin wrapper over the sign-out action. Server-side error handling already
 * redirects here on a 401, so the route stays as the one entry point that can
 * be reached with a plain navigation.
 */
export async function GET() {
  await signOut();

  redirect(ROUTES.SIGN_IN);
}
