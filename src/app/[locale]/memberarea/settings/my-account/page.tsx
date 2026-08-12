import { getApi } from '@/libs/server/api';

import { MyAccountForm } from './_components/my-account-form';
import type { User } from './_types/user.types';

const MyAccountPage = async () => {
  const api = await getApi();
  const user = await api.get<User>('/user');

  return <MyAccountForm user={user} />;
};

export default MyAccountPage;
