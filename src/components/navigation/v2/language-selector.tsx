'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useSearchParams } from 'next/navigation';
import { type Locale, useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@/components/ui/icon';
import { ButtonV2 } from '@/components/ui/v2/button';
import { useUpdateLocaleMutation } from '@/hooks/api/use-update-locale-mutation';
import { AvailableLanguages } from '@/libs/i18n';
import { resolveLocale, usePathname, useRouter } from '@/libs/i18n-routing';
import { cn } from '@/libs/utils';

/*
 * Restyle of components/language-selector.tsx. The locale-switching behaviour is
 * carried over unchanged — same `useUpdateLocaleMutation`, same push-then-refresh,
 * same `AvailableLanguages` list.
 *
 * The design gives two different surfaces for the same action: a bottom sheet on
 * mobile (13060:58352) and nothing at all for desktop, where the legacy dropdown
 * is the only reference. So mobile gets a Radix Dialog sheet and desktop keeps the
 * Radix DropdownMenu, each with its own trigger. One shared trigger driving both
 * roots is not possible without lifting state out of Radix, and the trigger is
 * four lines.
 *
 * The Figma sheet lists only English and Español; `AvailableLanguages` is longer.
 * The full list is kept — the frame is a mock, not a product decision, and
 * dropping locales would be a behaviour change.
 */

const TriggerContent = ({ code }: { code: string }) => (
  <>
    <Icon name="globe" className="size-5 text-fg-quaternary" />
    <span className="uppercase">{code}</span>
  </>
);

export const LanguageSelectorV2 = ({ className }: { className?: string }) => {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('__NEW__.navigation');
  const [selectedLanguage, setSelectedLanguage] = useState(locale);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { mutate: updateLocale } = useUpdateLocaleMutation({
    onSuccess: (locale) => {
      const query = Object.fromEntries(searchParams.entries());
      router.push({ pathname, query }, { locale: resolveLocale(locale) });
      router.refresh();
    },
    onError: () => {},
  });

  const handleChangeLanguage = (next: Locale) => {
    setSelectedLanguage(next);
    updateLocale(next);
    setSheetOpen(false);
  };

  const current = AvailableLanguages.find((lang) => lang.code === locale) || AvailableLanguages[0]!;

  const triggerClasses = 'gap-1 text-sm-medium text-text-tertiary hover:text-text-tertiary-hover';

  return (
    <>
      {/* Mobile — bottom sheet */}
      <div className={cn('lg:hidden', className)}>
        <Dialog.Root open={sheetOpen} onOpenChange={setSheetOpen}>
          <Dialog.Trigger asChild>
            <ButtonV2 hierarchy="link-gray" size="md" className={triggerClasses} aria-label={t('change_language')}>
              <TriggerContent code={current.code} />
            </ButtonV2>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-alpha-black-30 backdrop-blur-xl" />
            <Dialog.Content
              className={`
                fixed inset-x-2 bottom-2 z-50 rounded-2xl bg-bg-primary p-2 shadow-uui-overlay
                focus:outline-hidden
              `}
            >
              <Dialog.Title className="px-4 py-3 font-body text-md-semibold text-text-primary">
                {t('language')}
              </Dialog.Title>
              {/*
               * Capped and scrollable because the frame mocks two locales and
               * `AvailableLanguages` ships 13 — uncapped, the sheet grows to fill
               * the viewport and stops reading as a bottom sheet. Keeping every
               * locale is the behaviour; keeping the proportions is the design.
               */}
              <ul className="max-h-[60vh] overflow-y-auto pb-2">
                {AvailableLanguages.map((lang) => {
                  const isSelected = lang.code === selectedLanguage;

                  return (
                    <li key={lang.code}>
                      <button
                        type="button"
                        onClick={() => handleChangeLanguage(lang.code)}
                        className={cn(
                          `
                            flex w-full cursor-pointer items-center justify-between rounded-lg px-4 py-3 text-left
                            font-body text-text-primary
                            hover:bg-bg-secondary
                          `,
                          isSelected ? 'bg-bg-secondary text-md-medium' : 'text-md-regular',
                        )}
                      >
                        {lang.name}
                        {isSelected && <Icon name="tick" className="size-5 text-fg-brand-primary" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <Dialog.Close asChild>
                <ButtonV2 hierarchy="secondary-gray" size="lg" className="w-full">
                  {t('cancel')}
                </ButtonV2>
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {/* Desktop — dropdown, no Figma frame; legacy interaction restyled */}
      <div className={cn('hidden lg:block', className)}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <ButtonV2 hierarchy="link-gray" size="md" className={triggerClasses} aria-label={t('change_language')}>
              <TriggerContent code={current.code} />
            </ButtonV2>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="min-w-40 rounded-lg border border-border-secondary bg-bg-primary p-1 shadow-uui-md"
          >
            {AvailableLanguages.map((lang) => {
              const isSelected = lang.code === selectedLanguage;

              return (
                <DropdownMenuItem
                  key={lang.code}
                  onSelect={() => handleChangeLanguage(lang.code)}
                  className={cn(
                    `
                      flex cursor-pointer items-center justify-between rounded-sm px-3 py-2 font-body text-text-primary
                      hover:bg-bg-secondary
                    `,
                    isSelected ? 'text-sm-medium' : 'text-sm-regular',
                  )}
                >
                  {lang.name}
                  {isSelected && <Icon name="tick" className="size-4 text-fg-brand-primary" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
};
