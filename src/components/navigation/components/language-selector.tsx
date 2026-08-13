import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItemCompressed,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IconGlobeLine } from '@/components/ui/icon/icons';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUpdateLocaleMutation } from '@/hooks/api/use-update-locale-mutation';
import { AvailableLanguages } from '@/libs/i18n';
import { usePathname, useRouter } from '@/libs/i18n-routing';

export const LanguageSelector = () => {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedLanguage, setSelectedLanguage] = useState(locale);

  const { mutate: updateLocale } = useUpdateLocaleMutation({
    onSuccess: (locale) => {
      const query = Object.fromEntries(searchParams.entries());
      router.push({ pathname, query }, { locale });
      router.refresh();
    },
    onError: () => {
    },
  });

  const handleChangeLanguage = (locale: string) => {
    setSelectedLanguage(locale);
    updateLocale(locale);
  };

  const country = AvailableLanguages.find(lang => lang.code === locale) || AvailableLanguages[0];
  const { name, code } = country!;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`
            min-w-[86px] gap-0.5 px-1 text-sm font-semibold text-weak uppercase
            hover:bg-transparent hover:text-weak
            xs:px-2 xs:text-base
            sm:gap-2 sm:px-4
            lg:self-center
          `}
        >
          <IconGlobeLine size="fontSize" className="text-neutral xs:size-5" />
          <abbr title={name} className="px-1 no-underline">{code}</abbr>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[4.5rem] grid-cols-1">
        <ScrollArea className="h-40 px-2">
          {AvailableLanguages.map(lang => (
            <DropdownMenuItemCompressed
              value={lang.code}
              valueSelected={selectedLanguage}
              key={lang.code}
              onSelect={() => handleChangeLanguage(lang.code)}
            >
              {`${lang.name} (${lang.code.toUpperCase()})`}
            </DropdownMenuItemCompressed>
          ))}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
