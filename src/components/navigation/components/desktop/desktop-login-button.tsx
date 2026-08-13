import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { Link } from '@/libs/i18n-routing';

export function DesktopLoginButton() {
  const t = useTranslations('common');

  return (
    <Button
      asChild
      size="sm"
      className={`
        hidden h-10 min-w-[83px] px-4 text-base font-semibold text-weak
        shadow-[0px_4px_8px_-2px_rgba(0,0,0,0.04),0px_2px_4px_-2px_rgba(0,0,0,0.08)]
        hover:bg-[#F9F9FA] hover:text-weak
        active:shadow-none
        lg:flex
      `}
      variant="outline"
    >
      <Link href={ROUTES.SIGN_IN}>{t('login')}</Link>
    </Button>
  );
}
