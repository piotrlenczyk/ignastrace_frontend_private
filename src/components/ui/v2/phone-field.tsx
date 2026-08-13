'use client';

import type { CountryCode, E164Number } from 'libphonenumber-js';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import * as React from 'react';
import * as RPNInput from 'react-phone-number-input';

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Flag } from '@/components/ui/flag';
import { Icon } from '@/components/ui/icon';
import { localeMap } from '@/components/ui/phone-input/constants';
import type { PhoneInputProps } from '@/components/ui/phone-input/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/libs/utils';
import { formatPhoneNumberPlaceholder } from '@/utils/formatPhoneNumberPlaceholder';

/*
 * The new-design phone field (CTA form 10047:17509).
 *
 * This is a restyle of components/ui/phone-input, not a reimplementation: the
 * country list, calling-code formatting, placeholder-per-country and locale labels
 * still come from `react-phone-number-input` driven exactly as the legacy
 * component drives it. Only the three presentational sub-components are new,
 * because the legacy ones carry legacy tokens (`text-gray-700`, `variant="ghost"`)
 * that the migrated-path lint rule will reject.
 *
 * The country dropdown panel has no Figma frame — the design only shows the closed
 * trigger — so its surface is styled from the new tokens by analogy with the
 * language dropdown, and the Command/Popover search behaviour is untouched.
 */

type CountrySelectOption = { label: string; value: RPNInput.Country };

/*
 * The design's chevron is Untitled UI's `chevron-down`. The project's icon set has
 * no stroked chevron — `caret-down` is a filled triangle, the wrong glyph — and
 * adding one via `generate:icons` rewrites the import formatting of all 122
 * existing icons, so the path is inlined here instead. Geometry and stroke are the
 * design's own (exported asset: `M0.875 0.875L4.875 4.875L8.875 0.875`,
 * stroke-width 1.75, #A4A7AE), translated into a 16px box to match the 16px icon
 * frame; #A4A7AE is `fg-quaternary`, so it rides on currentColor here.
 */
const ChevronDown = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden className={cn('inline-block', className)}>
    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CountrySelectV2 = ({
  disabled,
  value,
  onChange,
  options,
}: {
  disabled?: boolean;
  value: RPNInput.Country;
  onChange: (value: RPNInput.Country) => void;
  options: CountrySelectOption[];
}) => {
  const t = useTranslations('__NEW__.phone_field');

  const handleSelect = React.useCallback((country: RPNInput.Country) => onChange(country), [onChange]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={`
            flex shrink-0 cursor-pointer items-center gap-1 rounded-sm px-2 py-1 font-body text-md-regular
            text-text-primary
            hover:bg-bg-primary-hover
            focus-visible:ring-2 focus-visible:ring-effects-focus-ring focus-visible:outline-hidden
            disabled:pointer-events-none disabled:text-text-disabled
            lg:px-3
            [&_svg]:shrink-0
          `}
        >
          <span className="flex size-6 items-center justify-center [&_svg]:size-6">
            <Flag countryCode={value} />
          </span>
          {value ? `+${RPNInput.getCountryCallingCode(value)}` : ''}
          <ChevronDown className={cn('size-4 text-fg-quaternary', disabled && 'hidden')} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[330px] rounded-lg border border-border-secondary bg-bg-primary p-0 shadow-uui-md"
        align="start"
        sideOffset={8}
      >
        <Command>
          <CommandList>
            <ScrollArea className="h-72">
              <CommandInput className="border-border-secondary font-body text-md-regular" placeholder={t('search')} />
              <CommandEmpty className="p-4 font-body text-sm-regular text-text-tertiary">
                {t('no_results')}
              </CommandEmpty>
              <CommandGroup>
                {options
                  .filter((option) => option.value)
                  .map((option) => (
                    <CommandItem
                      key={option.value}
                      onSelect={() => handleSelect(option.value)}
                      className="gap-2 rounded-sm px-3 py-2 font-body text-sm-regular text-text-primary"
                    >
                      <span className="flex size-5 items-center justify-center [&_svg]:size-5">
                        <Flag countryCode={option.value} />
                      </span>
                      <span className="flex-1">{option.label}</span>
                      <span className="text-text-tertiary">{`+${RPNInput.getCountryCallingCode(option.value)}`}</span>
                      <Icon
                        name="tick"
                        className={cn(
                          'size-4 text-fg-brand-primary',
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

const InputComponentV2 = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        `
          min-w-0 flex-1 border-none bg-transparent font-body text-md-regular text-text-primary outline-0
          placeholder:text-text-quaternary
        `,
        className,
      )}
      {...props}
    />
  ),
);
InputComponentV2.displayName = 'InputComponentV2';

const FlagComponentV2 = ({ country }: RPNInput.FlagProps) => <Flag countryCode={country} />;

export const PhoneFieldV2: React.ForwardRefExoticComponent<PhoneInputProps> = React.forwardRef<
  React.ElementRef<typeof RPNInput.default>,
  PhoneInputProps
>(({ className, onChange, onSelectCountry, ...props }, ref) => {
  const locale = useLocale();
  const labels = React.useMemo(() => localeMap[locale as keyof typeof localeMap], [locale]);
  const searchParams = useSearchParams();
  const country = searchParams.get('country') || props.defaultCountry || 'GB';

  const [placeholder, setPlaceholder] = React.useState(
    formatPhoneNumberPlaceholder(props.defaultCountry as CountryCode),
  );

  const handleCountryChange = React.useCallback(
    (value: CountryCode) => {
      onSelectCountry?.(value);
      setPlaceholder(formatPhoneNumberPlaceholder(value));
    },
    [onSelectCountry],
  );

  return (
    <RPNInput.default
      ref={ref}
      className={cn('flex w-full items-center', className)}
      flagComponent={FlagComponentV2}
      countrySelectComponent={CountrySelectV2}
      inputComponent={InputComponentV2}
      defaultCountry={country as CountryCode}
      labels={labels}
      placeholder={placeholder}
      name="phoneNumber"
      onChange={(value) => onChange?.(value || ('' as E164Number))}
      onCountryChange={handleCountryChange}
      {...props}
    />
  );
});
PhoneFieldV2.displayName = 'PhoneFieldV2';
