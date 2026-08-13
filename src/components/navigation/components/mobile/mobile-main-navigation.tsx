'use client';

import { useTranslations } from 'next-intl';

import { getNavigationItems } from '../helpers/main-navigation';
import { MobileLoginButton } from './mobile-login-button';
import { MobileNavItem } from './mobile-nav-item';

export const MobileMainNavigation = ({ onClick }: { onClick: () => void }) => {
  const t = useTranslations('navigation');

  const items = getNavigationItems('mobile');

  return (
    <>
      {items.map((item) => {
        return (
          <MobileNavItem
            href={item.href}
            key={item.name}
            onClick={onClick}
            variant={item.name === 'settings' ? 'outline' : 'ghost'}
          >
            {t(item.name as any)}
          </MobileNavItem>
        );
      })}
      <MobileLoginButton onClick={onClick} isAuthenticated={false} />
    </>
  );
};
