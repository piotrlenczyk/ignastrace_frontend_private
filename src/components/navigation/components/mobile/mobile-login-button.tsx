import { useTranslations } from 'next-intl';

import { ROUTES } from '@/constants/routes';

import { MobileNavItem } from './mobile-nav-item';

export function MobileLoginButton({
  isAuthenticated = false,
  onClick,
}: {
  isAuthenticated?: boolean;
  onClick: () => void;
}) {
  const t = useTranslations('common');

  if (isAuthenticated) {
    return;
  }

  return (
    <MobileNavItem href={ROUTES.SIGN_IN} onClick={onClick} variant="outline">
      {t('login')}
    </MobileNavItem>
  );
}
