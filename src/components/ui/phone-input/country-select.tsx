'use client';

import { useTranslations } from 'next-intl';
import * as React from 'react';
import * as RPNInput from 'react-phone-number-input';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/libs/utils';

import { Flag } from '../flag';
import { IconCaretDown } from '../icon/icons';
import { IconCheck } from '../icon/icons/Check';
import { ScrollArea } from '../scroll-area';

type CountrySelectOption = { label: string; value: RPNInput.Country };

type CountrySelectProps = {
  disabled?: boolean;
  value: RPNInput.Country;
  onChange: (value: RPNInput.Country) => void;
  options: CountrySelectOption[];
};

const CountrySelect = ({
  disabled,
  value,
  onChange,
  options,
}: CountrySelectProps) => {
  const handleSelect = React.useCallback(
    (country: RPNInput.Country) => {
      onChange(country);
    },
    [onChange],
  );

  const t = useTranslations('components.phone_input');

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={cn('flex gap-1 rounded-lg px-3')}
          disabled={disabled}
        >
          <Flag countryCode={value} />
          {value ? `+${RPNInput.getCountryCallingCode(value)}` : ''}
          <IconCaretDown
            className={cn(
              '-mr-2 size-4 opacity-50',
              disabled ? 'hidden' : 'opacity-100',
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[330px] border-[hsla(var(--gray-transparent-500))] p-0" align="start" sideOffset={0} alignOffset={-4}>
        <Command>
          <CommandList>
            <ScrollArea className="h-72">
              <CommandInput className="border-[hsla(var(--gray-transparent-500))]" placeholder={t('search_placeholder')} />
              <CommandEmpty>
                {t('no_results')}
              </CommandEmpty>
              <CommandGroup>
                {options
                  .filter(x => x.value)
                  .map(option => (
                    <CommandItem
                      className="gap-2 py-2"
                      key={option.value}
                      onSelect={() => handleSelect(option.value)}
                    >
                      <Flag countryCode={option.value} />
                      <span className="flex-1 text-sm">{option.label}</span>
                      {option.value && (
                        <span className="text-sm text-foreground/50">
                          {`+${RPNInput.getCountryCallingCode(option.value)}`}
                        </span>
                      )}
                      <IconCheck
                        className={cn(
                          'ml-auto size-4',
                          option.value === value ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                    </CommandItem>
                  ))}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export { CountrySelect };
export type { CountrySelectOption, CountrySelectProps };
