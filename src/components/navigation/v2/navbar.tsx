'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Suspense, useState } from 'react';

import { ButtonV2 } from '@/components/ui/v2/button';
import { ROUTES } from '@/constants/routes';
import { Link, usePathname } from '@/libs/i18n-routing';

import { LanguageSelectorV2 } from './language-selector';
import { MobileMenuV2 } from './mobile-menu';
import { desktopNavItems } from './nav-items';

/*
 * Restyle of navigation/navbar.tsx for the new design (header 13002:219861).
 *
 * The `isReverseLookupPage` logo-href behaviour is carried over from the legacy
 * navbar unchanged. The `languageSelectorVisible` state is not — see the note in
 * mobile-menu.tsx.
 */
export const NavbarV2 = () => {
  const t = useTranslations('__NEW__.navigation');
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isReverseLookupPage = pathname.includes('/reverse-phone-lookup') || pathname.includes('/lookup-');
  const logoHref = isReverseLookupPage ? ROUTES.REVERSE_LOOKUP.HOME : ROUTES.HOME;

  return (
    <header className="sticky top-0 z-50 border-b border-border-secondary-alt bg-bg-primary">
      <nav className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 lg:px-8">
        <Link href={logoHref} aria-label={t('home')}>
          <Image src="/images/ignastrace-logotype.svg" width={151} height={32} alt="IgnasTrace.io" priority />
        </Link>

        {/* Desktop nav — centred between the logo and the actions */}
        <ul className="hidden items-center gap-6 pr-4 lg:flex">
          {desktopNavItems.map((item) => (
            <li key={item.name}>
              <ButtonV2 asChild hierarchy="link-gray" size="md" className="text-sm-medium">
                <Link href={item.href}>{t(item.name)}</Link>
              </ButtonV2>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 lg:w-[151px] lg:justify-end lg:gap-5">
          <Suspense>
            <LanguageSelectorV2 />
          </Suspense>

          <ButtonV2 asChild hierarchy="secondary-gray" size="md" className="hidden lg:inline-flex">
            <Link href={ROUTES.SIGN_IN}>{t('login')}</Link>
          </ButtonV2>

          <MobileMenuV2 open={menuOpen} onOpenChange={setMenuOpen} />
        </div>
      </nav>
    </header>
  );
};
