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
 * Restyle of navigation/navbar.tsx for the new design — `Header`, `Style=Full`
 * (13002:2751 desktop, 13002:2765 mobile).
 *
 * The two breakpoints differ by more than spacing, which is why several values
 * here are paired rather than shared: the logo is 124×26 on mobile and 151×32 on
 * desktop, and the row is 58px against 64px. The design expresses those heights as
 * an outer `py-1` plus an inner `py-3` on mobile and a single `py-3` on desktop;
 * one `py` per breakpoint comes to the same totals against the tallest child —
 * the 26px logo on mobile, the 40px Log in button on desktop.
 *
 * The `isReverseLookupPage` logo-href behaviour is carried over from the legacy
 * navbar unchanged. The `languageSelectorVisible` state is not — see the note in
 * mobile-menu.tsx.
 *
 * The set also carries `Style=Short`/`Checkout` and a `Funnel` axis (the offer
 * banner and account row). Neither is implemented here: this component is the
 * site header, and those are checkout-funnel headers with their own content.
 */
export const NavbarV2 = () => {
  const t = useTranslations('__NEW__.navigation');
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isReverseLookupPage = pathname.includes('/reverse-phone-lookup') || pathname.includes('/lookup-');
  const logoHref = isReverseLookupPage ? ROUTES.REVERSE_LOOKUP.HOME : ROUTES.HOME;

  return (
    <header className="sticky top-0 z-50 border-b border-border-secondary-alt bg-bg-primary">
      <nav className="mx-auto flex max-w-[1440px] items-center justify-between p-4 lg:px-8 lg:py-3">
        <Link href={logoHref} aria-label={t('home')}>
          {/*
           * `width`/`height` stay at the desktop size so the asset is never
           * upscaled; the class pair is what sets the rendered box at each
           * breakpoint. 26px and 124px have no named steps in this scale.
           */}
          <Image
            src="/images/ignastrace-logotype.svg"
            width={151}
            height={32}
            alt="IgnasTrace.io"
            className="h-[26px] w-[124px] lg:h-8 lg:w-[151px]"
            priority
          />
        </Link>

        {/* Desktop nav — centred between the logo and the actions */}
        <ul className="hidden items-center gap-6 pr-4 lg:flex">
          {desktopNavItems.map((item) => (
            <li key={item.name}>
              <ButtonV2 asChild hierarchy="link-gray" size="md">
                <Link href={item.href}>{t(item.name)}</Link>
              </ButtonV2>
            </li>
          ))}
        </ul>

        {/* 24px between the language selector and the hamburger on mobile, 20px between it and Log in on desktop. */}
        <div className="flex items-center gap-6 lg:w-[151px] lg:justify-end lg:gap-5">
          <Suspense>
            <LanguageSelectorV2 />
          </Suspense>

          <ButtonV2 asChild hierarchy="secondary" size="md" className="hidden lg:inline-flex">
            <Link href={ROUTES.SIGN_IN}>{t('login')}</Link>
          </ButtonV2>

          <MobileMenuV2 open={menuOpen} onOpenChange={setMenuOpen} />
        </div>
      </nav>
    </header>
  );
};
