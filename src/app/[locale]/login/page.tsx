import FunnelLayout from '@/components/layouts/funnel-layout';
import { ROUTES } from '@/constants/routes';
import { useAuthenticatedRedirect } from '@/hooks/use-auth-redirect';

import { LoginForm } from './components/login-form';

export default async function LoginInPage({ searchParams }: { searchParams: { error?: string } }) {
  const error = !!searchParams.error;

  await useAuthenticatedRedirect({
    activeSubscriptionRoute: ROUTES.MEMBER.FIND_BY_NUMBER.HOME,
    endedSubscriptionRoute: ROUTES.MEMBER.SETTINGS.BILLING,
  });

  return (
    <FunnelLayout>
      <main className="s-main bg-alternate p-6">
        <div className="container-small">
          <LoginForm error={error} />
        </div>
      </main>
    </FunnelLayout>
  );
}
