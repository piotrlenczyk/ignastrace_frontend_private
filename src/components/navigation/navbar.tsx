'use client';

import { Suspense, useState } from 'react';

import { LanguageSelector } from '@/components/navigation/components/language-selector';
import { ROUTES } from '@/constants/routes';
import { Link, usePathname } from '@/libs/i18n-routing';

import { Logotype } from '../logotype';
import { DesktopLoginButton } from './components/desktop/desktop-login-button';
import { DesktopMainNavigation } from './components/desktop/desktop-main-navigation';
import { MobileDropdownMenu } from './components/mobile/mobile-dropdown-menu';

export const Navbar = () => {
  const [languageSelectorVisible, setLanguageSelectorVisible] = useState(true);
  const pathname = usePathname();

  const toggleLanguageSelectorVisibility = () => {
    setLanguageSelectorVisible(!languageSelectorVisible);
  };

  const isReverseLookupPage = pathname.includes('/reverse-phone-lookup')
    || pathname.includes('/lookup-');

  const logoHref = isReverseLookupPage ? ROUTES.REVERSE_LOOKUP.HOME : ROUTES.HOME;

  return (
    <header className="s-header">
      <nav className="s-header-nav">
        <div className="mr-auto flex items-center space-x-4">
          <Link href={logoHref} className="text-2xl font-bold text-primary">
            <Logotype />
          </Link>
        </div>

        <div className="flex items-center gap-x-4">
          <div className="hidden lg:mb-[2px] lg:block">
            <DesktopMainNavigation />
          </div>
          <Suspense>
            {languageSelectorVisible && <LanguageSelector />}
          </Suspense>
        </div>

        <MobileDropdownMenu
          toggleLanguageSelectorVisibility={toggleLanguageSelectorVisibility}
        />
        <DesktopLoginButton />
      </nav>
    </header>
  );
};
