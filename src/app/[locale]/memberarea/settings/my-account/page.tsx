import { redirect } from 'next/navigation';

import { ROUTES } from '@/constants/routes';
import { apiServerClient } from '@/network/api/apiServerClient';

import { MyAccountForm } from './_components/my-account-form';

const MyAccountPage = async () => {
  const { data } = await apiServerClient['/api/v1/user/me'].GET();

  if (!data) {
    redirect(ROUTES.HOME);
  }

  return <MyAccountForm user={data} />;
};

export default MyAccountPage;
