import { redirect } from 'next/navigation';

import { ROUTES } from '@/constants/routes';
import { actionLogout } from '@/server/actions/auth.actions';

/*
 * A thin wrapper over the sign-out action. Server-side error handling already
 * redirects here on a 401, so the route stays as the one entry point that can
 * be reached with a plain navigation.
 */
export async function GET() {
  await actionLogout();

  redirect(ROUTES.SIGN_IN);
}
