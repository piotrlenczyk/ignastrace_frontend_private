'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Icon } from '@/components/ui/icon';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ROUTES } from '@/constants/routes';
import { Link, usePathname } from '@/libs/i18n-routing';
import { cn } from '@/libs/utils';
import { useSettings } from '@/settings/settings.provider';

import ToolItem from './tool-item';

type ItemProps = {
  className?: string;
  href: string | string[];
  active?: string[];
  children: React.ReactNode;
};

const getActive = (active: string | string[], pathname: string) => {
  return pathname === active || (Array.isArray(active) && active.includes(pathname));
};

const Item = ({ className, href, children, active }: ItemProps) => {
  const pathname = usePathname();
  const primaryHref = Array.isArray(href) ? href[0] : href;

  return (
    <Link
      href={primaryHref || '/'}
      className={cn(
        'relative flex flex-1 flex-col items-center gap-1 text-center text-xs [&_svg]:text-neutral',
        getActive(active || href, pathname) && 'text-primary [&_svg]:text-primary',
        className,
      )}
    >
      {children}
    </Link>
  );
};

export const FooterNav = () => {
  const { reverseLookupEnabled: enableReverseLookup } = useSettings();
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const t = useTranslations('pages.memberArea.navigation');

  const handleToolClick = () => {
    setIsToolsOpen(false);
  };

  return (
    <>
      <div className="sticky bottom-0 bg-background px-4 py-3 lg:hidden print:hidden">
        <nav className="container-wide flex justify-around gap-1 text-xs text-weak">
          <Item href={ROUTES.MEMBER.STATUS.HOME}>
            <Icon name="timer" />
          </Item>
          <button type="button" onClick={() => setIsToolsOpen(true)} className="flex flex-col items-center">
            <Icon name="menu-square" />
          </button>
          <Item
            href={[ROUTES.MEMBER.SETTINGS.ACCOUNT, ROUTES.MEMBER.SETTINGS.BILLING, ROUTES.MEMBER.SETTINGS.GET_HELP]}
          >
            <Icon name="setting" />
          </Item>
        </nav>
      </div>

      <Sheet open={isToolsOpen} onOpenChange={setIsToolsOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl p-0 pb-8" hideCloseButton>
          <SheetHeader className="mb-6 border-b border-stroke-weak px-4 pt-6">
            <SheetTitle className="pb-2 text-left text-lg font-bold">{t('tools_library')}</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-2 px-4">
            <ToolItem
              icon={<Icon name="location" className="text-primary" />}
              label={t('find_by_number')}
              href={ROUTES.MEMBER.FIND_BY_NUMBER.HOME}
              onClick={handleToolClick}
            />
            <ToolItem
              icon={<Icon name="link" className="text-primary" />}
              label={t('find_by_link')}
              href={ROUTES.MEMBER.FIND_BY_LINK.HOME}
              onClick={handleToolClick}
            />
            {enableReverseLookup && (
              <ToolItem
                icon={<Icon name="phone" className="text-primary" />}
                label={t('phone_lookup')}
                href={ROUTES.REVERSE_LOOKUP.MEMBER.PHONE_LOOKUP.FORM}
                onClick={handleToolClick}
              />
            )}
            <ToolItem
              icon={<Icon name="handcuffs" className="text-primary" />}
              label={t('sex_offenders_search')}
              href={ROUTES.MEMBER.SEX_OFFENDERS_SEARCH.HOME}
              onClick={handleToolClick}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
