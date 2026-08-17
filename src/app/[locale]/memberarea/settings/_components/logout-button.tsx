'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';
import { useRouter } from '@/libs/i18n-routing';
import { cn } from '@/libs/utils';
import { actionLogout } from '@/server/actions/auth.actions';

type LogoutButtonProps = {
  className?: string;
};

export const LogoutButton = ({ className }: LogoutButtonProps) => {
  const tCommon = useTranslations('common');
  const router = useRouter();

  const handleLogout = async () => {
    await actionLogout();
    router.push(ROUTES.HOME);
    router.refresh();
  };

  return (
    <Button
      size="lg"
      className={cn('mb-2 w-full gap-2 border-primary text-primary hover:text-primary lg:hidden', className)}
      variant="outline"
      onClick={handleLogout}
    >
      <Icon name="logout" className="size-[1em] text-base" />
      <span className="text-base font-semibold">{tCommon('logout')}</span>
    </Button>
  );
};
