import { redirect } from 'next/navigation';

import { ROUTES } from '@/constants/routes';
import { getApi } from '@/libs/server/api';
import { getUserCountry } from '@/libs/server/user-country';
import type { Subscription } from '@/types/subscription';

import { BillingPageClient } from './_components/billing-page-client';

const BillingPage = async () => {
  const api = await getApi();
  const subscription = await api.get<Subscription>('/subscription');

  const country = await getUserCountry();

  if (!subscription) {
    redirect(ROUTES.HOME);
  }

  return <BillingPageClient subscription={subscription} country={country} />;
};

export default BillingPage;
