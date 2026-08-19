'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Logotype } from '@/components/logotype';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';
import { Link, usePathname } from '@/libs/i18n-routing';
import { cn } from '@/libs/utils';
import { useSettings } from '@/settings/settings.provider';

import { NumericBadge } from './numeric-badge';

type ItemProps = {
  className?: string;
  path: string;
  href: string | string[];
  children: React.ReactNode;
};

const getActive = (pathname: string, href: string | string[]) => {
  return pathname === href || (Array.isArray(href) && href.includes(pathname));
};

const Item = ({ className, path, href, children }: ItemProps) => {
  const primaryHref = Array.isArray(href) ? href[0] : href;

  return (
    <Link
      href={primaryHref || '/'}
      className={cn(
        'relative flex flex-row items-center gap-2 text-center text-weak',
        'font-semibold lg:text-sm xl:text-base [&_svg]:text-base [&_svg]:text-neutral',
        getActive(path, href) && 'text-primary [&_svg]:text-primary',
        className,
      )}
    >
      {children}
    </Link>
  );
};

export const HeaderNav = ({ unreadCount }: { unreadCount: number }) => {
  const t = useTranslations('pages.memberArea.navigation');

  const pathname = usePathname();
  const [fullPath, setFullPath] = useState<string>(pathname);
  const { reverseLookupEnabled, countryCode: country } = useSettings();

  useEffect(() => {
    setFullPath(pathname + window.location.hash);
  }, [pathname]);

  const logoLink =
    country === 'US' || country === 'GB' ? ROUTES.MEMBER.FIND_BY_LINK.HOME : ROUTES.MEMBER.FIND_BY_NUMBER.HOME;

  return (
    <header className="s-header lg:hidden">
      <nav className="s-header-nav">
        <div className="mr-auto flex items-center space-x-4">
          <Link href={logoLink} className="print-remove-link text-2xl font-bold text-primary">
            <Logotype />
          </Link>
        </div>
        <div className="hidden gap-7 lg:flex xl:gap-8 print:hidden">
          <Item path={fullPath} href={ROUTES.MEMBER.FIND_BY_NUMBER.HOME}>
            <Icon name="location" />
            {t('find_by_number')}
          </Item>
          <Item path={fullPath} href={ROUTES.MEMBER.FIND_BY_LINK.HOME}>
            <Icon name="link" />
            {t('find_by_link')}
          </Item>
          {reverseLookupEnabled && (
            <Item
              path={fullPath}
              href={[
                ROUTES.REVERSE_LOOKUP.MEMBER.PHONE_LOOKUP.FORM,
                ROUTES.REVERSE_LOOKUP.MEMBER.PHONE_LOOKUP.PROGRESS,
              ]}
            >
              <Icon name="phone" />
              {t('phone_lookup')}
            </Item>
          )}
          <Item path={fullPath} href={ROUTES.MEMBER.STATUS.HOME}>
            <Icon name="timer" />
            {t('status')}
          </Item>
          <Item path={fullPath} href={ROUTES.MEMBER.CONTACT_US}>
            <Icon name="mail" />
            {t('contact_us')}
          </Item>
          <Item path={fullPath} href={ROUTES.MEMBER.SETTINGS.NOTIFICATIONS} className="relative">
            <Icon name="alert-circle" />
            <NumericBadge
              amount={unreadCount}
              className="absolute top-[-12px] right-[80%] translate-x-9 animate-fade-in"
            />
          </Item>
          <Item path={fullPath} href={ROUTES.MEMBER.SETTINGS.ACCOUNT}>
            <Icon name="setting" />
          </Item>
        </div>
        <div className="flex items-center gap-2 lg:hidden print:hidden">
          <Button
            variant="ghost"
            className={cn(
              'size-12 p-0 text-neutral',
              getActive(fullPath, ROUTES.MEMBER.CONTACT_US) && 'text-primary [&_svg]:text-primary',
            )}
            asChild
          >
            <Link href={ROUTES.MEMBER.CONTACT_US}>
              <Icon name="mail" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            className={cn(
              'size-12 p-0 text-neutral',
              getActive(fullPath, ROUTES.MEMBER.SETTINGS.NOTIFICATIONS) && 'text-primary [&_svg]:text-primary',
              'relative',
            )}
            asChild
          >
            <Link href={ROUTES.MEMBER.SETTINGS.NOTIFICATIONS}>
              <Icon name="alert-circle" />
              {unreadCount > 0 && (
                <div
                  className={`
                    absolute top-[8px] right-[92%] size-2 translate-x-9 animate-fade-in rounded-full bg-red-1000
                  `}
                ></div>
              )}
            </Link>
          </Button>
        </div>
      </nav>
    </header>
  );
};
