'use client';

import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { IconLogOut } from '@/components/ui/icon/icons';
import { ROUTES } from '@/constants/routes';

type LogoutButtonProps = {
  className?: string;
};

export const LogoutButton = ({ className }: LogoutButtonProps) => {
  const tCommon = useTranslations('common');

  const handleLogout = async () => {
    await signOut({ redirect: true, redirectTo: ROUTES.HOME });
  };

  return (
    <Button
      size="lg"
      className={`mb-2 w-full gap-2 border-primary text-primary hover:text-primary lg:hidden ${className ?? ''}`}
      variant="outline"
      onClick={handleLogout}
    >
      <IconLogOut size="fontSize" className="text-base" />
      <span className="text-base font-semibold">{tCommon('logout')}</span>
    </Button>
  );
};
