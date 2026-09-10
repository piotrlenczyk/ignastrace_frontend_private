'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Menu, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ButtonV2 } from '@/components/ui/v2/button';
import VisuallyHidden from '@/components/ui/visually-hidden';
import { ROUTES } from '@/constants/routes';
import { Link } from '@/libs/i18n-routing';

import { mobileNavItems } from './nav-items';

/*
 * Restyle of components/mobile/mobile-dropdown-menu.tsx.
 *
 * Two departures from the legacy component, both read off the frame
 * (13019:50411) rather than chosen:
 *
 * - The panel starts *below* the header instead of covering it. The frame shows
 *   the real header still in place with the hamburger swapped for an X, so
 *   duplicating the logo and language selector inside the panel would render the
 *   same pixels from two sources.
 * - The language selector stays visible. The legacy navbar hid it while the menu
 *   was open (`toggleLanguageSelectorVisibility`), which is why that prop is gone
 *   here — `modal={false}` keeps the header interactive so the selector still works
 *   with the menu open.
 */
export const MobileMenuV2 = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
  const t = useTranslations('__NEW__.navigation');
  const Icon = open ? X : Menu;

  return (
    <div className="lg:hidden">
      <Dialog.Root open={open} onOpenChange={onOpenChange} modal={false}>
        <Dialog.Trigger asChild>
          {/*
           * A plain button rather than `ButtonV2`: the mobile header
           * (13002:2765) draws the hamburger as a bare 20px glyph in `fg-primary`
           * sitting directly in the 24px-gap action row — no surface, no padding.
           * Every `ButtonV2` hierarchy sets its own icon colour through a
           * descendant selector, which a class at the call site cannot outrank,
           * so using it here would mean fighting the component to get `fg-primary`.
           *
           * That leaves a 20px hit target, under the 44px usually wanted on touch.
           * It is what the frame specifies; raising it is a design change.
           */}
          <button
            type="button"
            aria-label={open ? t('close_menu') : t('open_menu')}
            className={`
              flex shrink-0 cursor-pointer items-center justify-center text-fg-primary
              focus-visible:ring-2 focus-visible:ring-effects-focus-ring focus-visible:ring-offset-2
              focus-visible:outline-hidden
            `}
          >
            <Icon className="size-5 shrink-0" />
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Content
            className={`
              fixed inset-x-0 top-16 bottom-0 z-40 flex flex-col items-center justify-center gap-8 bg-bg-secondary px-4
              focus:outline-hidden
            `}
          >
            <VisuallyHidden>
              <Dialog.Title>{t('menu_title')}</Dialog.Title>
              <Dialog.Description>{t('menu_description')}</Dialog.Description>
            </VisuallyHidden>

            <nav className="w-full">
              {/* gap-5 not gap-2: the frame's link pitch is 72px, and each item is
                  52px tall (py-3 twice plus a 28px line box). */}
              <ul className="flex flex-col items-center gap-5">
                {mobileNavItems.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => onOpenChange(false)}
                      className={`
                        block px-4 py-3 font-body text-lg-semibold text-text-secondary
                        hover:text-text-secondary-hover
                      `}
                    >
                      {t(item.name)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <ButtonV2 asChild hierarchy="secondary" size="lg" className="w-full max-w-sm">
              <Link href={ROUTES.SIGN_IN} onClick={() => onOpenChange(false)}>
                {t('login')}
              </Link>
            </ButtonV2>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};
