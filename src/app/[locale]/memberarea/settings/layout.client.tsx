'use client';

import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { LanguageSelector } from '@/components/navigation/components/language-selector';
import { Button } from '@/components/ui/button';
import { IconLogOut } from '@/components/ui/icon/icons';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ROUTES } from '@/constants/routes';
import { usePathname, useRouter } from '@/libs/i18n-routing';

const settingsTabs: { title: 'my_account' | 'billing' | 'get_help'; value: string }[] = [
  {
    title: 'my_account',
    value: ROUTES.MEMBER.SETTINGS.ACCOUNT,
  },
  {
    title: 'billing',
    value: ROUTES.MEMBER.SETTINGS.BILLING,
  },
  {
    title: 'get_help',
    value: ROUTES.MEMBER.SETTINGS.GET_HELP,
  },
];

type SettingsLayoutClientProps = {
  children: React.ReactNode;
};

export function SettingsLayoutClient({ children }: SettingsLayoutClientProps) {
  const t = useTranslations('pages.settings');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const pathname = usePathname();

  const handleTabChange = (value: string) => {
    router.replace(value, { scroll: false });
  };

  const handleLogout = async () => {
    await signOut({ redirect: true, redirectTo: ROUTES.HOME });
  };

  const getCurrentTabValue = () => {
    return settingsTabs.find(tab => pathname.includes(tab.value))?.value || settingsTabs?.[0]?.value;
  };

  useEffect(() => {
    Promise.all(
      settingsTabs.map(tab =>
        router.prefetch(tab.value),
      ),
    );
  }, [router]);

  return (
    <div className="flex flex-col px-4 lg:p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="h3 font-bold">{t('title')}</h1>
        <div className="flex items-center justify-between text-weak">
          <Button
            className="hidden gap-2 px-2 text-sm hover:bg-transparent lg:inline-flex"
            variant="ghost"
            onClick={handleLogout}
          >
            <IconLogOut size="fontSize" className="text-sm xs:text-base" />
            {tCommon('logout')}
          </Button>
          <LanguageSelector />
        </div>
      </header>

      <div className="container-content">
        <Tabs
          value={getCurrentTabValue()}
          onValueChange={handleTabChange}
        >
          <TabsList className="mb-4 w-full">
            {settingsTabs.map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="grow text-sm xs:text-base"
              >
                {t(`${tab.title}.title`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {children}
      </div>
    </div>
  );
}
