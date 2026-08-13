'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Logotype } from '@/components/logotype';
import { Icon } from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';
import { useFeatures } from '@/hooks/use-features';
import { useCountry } from '@/hooks/useCountry';
import { Link, usePathname } from '@/libs/i18n-routing';
import { cn } from '@/libs/utils';

import { NumericBadge } from './numeric-badge';

type ItemProps = {
  className?: string;
  href: string | string[];
  isActive?: boolean;
  children: React.ReactNode;
};

const Item = ({ className, href, isActive, children }: ItemProps) => {
  const primaryHref = Array.isArray(href) ? href[0] : href;

  return (
    <Link
      href={primaryHref || '/'}
      className={cn(
        'flex gap-2 rounded-lg px-3 py-2 text-base text-weak hover:bg-gray-50 [&_svg]:text-neutral',
        isActive && 'bg-primary-50 text-primary hover:bg-primary-50 [&_svg]:text-primary',
        className,
      )}
    >
      {children}
    </Link>
  );
};

const getActive = (pathname: string, href: string | string[]) => {
  return pathname === href || (Array.isArray(href) && href.includes(pathname));
};

const HeaderNavVertical = ({ unreadCount }: { unreadCount: number }) => {
  const t = useTranslations('pages.memberArea.navigation');
  const pathname = usePathname();
  const [fullPath, setFullPath] = useState<string>(pathname);
  const { ENABLE_REVERSE_LOOKUP: enableReverseLookup } = useFeatures();

  useEffect(() => {
    setFullPath(pathname + window.location.hash);
  }, [pathname]);

  const country = useCountry();

  const logoLink =
    country === 'US' || country === 'GB' ? ROUTES.MEMBER.FIND_BY_LINK.HOME : ROUTES.MEMBER.FIND_BY_NUMBER.HOME;

  const navItems = [
    {
      key: 'find_by_number',
      href: [
        ROUTES.MEMBER.FIND_BY_NUMBER.HOME,
        ROUTES.MEMBER.FIND_BY_NUMBER.MESSAGE_SENDING,
        ROUTES.MEMBER.FIND_BY_NUMBER.SUCCESS,
      ],
      icon: <Icon name="location" />,
      label: t('find_by_number'),
      enabled: true,
    },
    {
      key: 'find_by_link',
      href: [ROUTES.MEMBER.FIND_BY_LINK.HOME, ROUTES.MEMBER.FIND_BY_LINK.SUCCESS],
      icon: <Icon name="link" />,
      label: t('find_by_link'),
      enabled: true,
    },
    {
      key: 'phone_lookup',
      href: [ROUTES.REVERSE_LOOKUP.MEMBER.PHONE_LOOKUP.FORM, ROUTES.REVERSE_LOOKUP.MEMBER.PHONE_LOOKUP.PROGRESS],
      icon: <Icon name="phone" />,
      label: t('phone_lookup'),
      enabled: enableReverseLookup,
    },
    {
      key: 'sex_offenders_search',
      href: [
        ROUTES.MEMBER.SEX_OFFENDERS_SEARCH.HOME,
        ROUTES.MEMBER.SEX_OFFENDERS_SEARCH.RESULTS,
        ROUTES.MEMBER.SEX_OFFENDERS_SEARCH.REPORT,
      ],
      icon: <Icon name="handcuffs" />,
      label: t('sex_offenders_search'),
      enabled: true,
    },
  ];

  return (
    <header className="s-header-nav-vertical hidden lg:block">
      <nav className="flex h-full flex-col">
        <div className="mb-8">
          <Link href={logoLink} className="print-remove-link text-2xl font-bold text-primary">
            <Logotype />
          </Link>
        </div>
        <div className="flex-1">
          <Item
            href={[
              ROUTES.MEMBER.STATUS.HOME,
              ROUTES.MEMBER.STATUS.DETAIL,
              ROUTES.MEMBER.STATUS.REPORT,
              ROUTES.MEMBER.STATUS.SEX_OFFENDERS,
              ROUTES.MEMBER.STATUS.DATA_BREACH_HISTORY,
            ]}
            isActive={getActive(fullPath, [
              ROUTES.MEMBER.STATUS.HOME,
              ROUTES.MEMBER.STATUS.DETAIL,
              ROUTES.MEMBER.STATUS.REPORT,
              ROUTES.MEMBER.STATUS.SEX_OFFENDERS,
              ROUTES.MEMBER.STATUS.DATA_BREACH_HISTORY,
            ])}
          >
            <Icon name="timer" />
            <span className="font-semibold">{t('my_activity')}</span>
          </Item>

          <hr className="mt-3 mb-4 border-gray-100" />

          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-weak">{t('tools_library')}</span>
            {navItems.map(
              (item) =>
                item.enabled && (
                  <Item key={item.key} href={item.href} isActive={getActive(fullPath, item.href)}>
                    {item.icon}
                    <span className="font-semibold">{item.label}</span>
                  </Item>
                ),
            )}
          </div>

          <hr className="my-3 border-gray-100" />

          <Item
            href={ROUTES.MEMBER.SETTINGS.NOTIFICATIONS}
            isActive={getActive(fullPath, ROUTES.MEMBER.SETTINGS.NOTIFICATIONS)}
            className="flex flex-1 items-center gap-2"
          >
            <div className="flex flex-1 items-center gap-2">
              <Icon name="alert-circle" />
              <span className="font-semibold">{t('notifications')}</span>
            </div>
            <NumericBadge amount={unreadCount} className="flex items-center justify-center" />
          </Item>
        </div>
        <div className="flex flex-col gap-2">
          <Item
            href={ROUTES.MEMBER.CONTACT_US}
            isActive={getActive(fullPath, ROUTES.MEMBER.CONTACT_US)}
            className="flex flex-1 items-center gap-2"
          >
            <Icon name="mail" />
            <span className="font-semibold">{t('contact_us')}</span>
          </Item>

          <Item
            href={[ROUTES.MEMBER.SETTINGS.ACCOUNT, ROUTES.MEMBER.SETTINGS.BILLING, ROUTES.MEMBER.SETTINGS.GET_HELP]}
            isActive={getActive(fullPath, [
              ROUTES.MEMBER.SETTINGS.ACCOUNT,
              ROUTES.MEMBER.SETTINGS.BILLING,
              ROUTES.MEMBER.SETTINGS.GET_HELP,
            ])}
          >
            <Icon name="setting" />
            <span className="font-semibold">{t('settings')}</span>
          </Item>
        </div>
      </nav>
    </header>
  );
};

export default HeaderNavVertical;
