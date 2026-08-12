import { redirect } from 'next/navigation';

import { ROUTES } from '@/constants/routes';
import { getFeatures } from '@/libs/server/feature-flags';

export default async function ReverseLookupLayout({ children }: { children: React.ReactNode }) {
  const features = await getFeatures();
  const { ENABLE_REVERSE_LOOKUP } = features;

  if (!ENABLE_REVERSE_LOOKUP) {
    redirect(ROUTES.HOME);
  }
  return <>{children}</>;
}
