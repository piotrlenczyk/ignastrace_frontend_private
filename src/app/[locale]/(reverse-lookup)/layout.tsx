import { redirect } from 'next/navigation';

import { ROUTES } from '@/constants/routes';
import { getServerSettings } from '@/settings/settings.server';

export default async function ReverseLookupLayout({ children }: { children: React.ReactNode }) {
  const { reverseLookupEnabled } = await getServerSettings();

  if (!reverseLookupEnabled) {
    redirect(ROUTES.HOME);
  }
  return <>{children}</>;
}
