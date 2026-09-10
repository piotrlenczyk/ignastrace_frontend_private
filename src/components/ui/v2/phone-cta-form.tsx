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
import { ButtonV2 } from '@/components/ui/v2/button';
import { cn } from '@/libs/utils';
import { formatPhoneNumberPlaceholder } from '@/utils/formatPhoneNumberPlaceholder';

/*
 * The new-design phone CTA form — `CTA From` (10047:17508) in the Figma file.
 * (The set's name carries the designer's typo; this file is named for what the
 * component is.)
 *
 * The set declares three properties, and two of them are not props here:
 *
 *   Product  Lookup | Locate    -> the `product` prop
 *   Type     Desktop | Mobile   -> a breakpoint, so `lg:` rather than a prop
 *   State    Default | Hover | Focus | Error
 *
 * `Type` is the project's usual treatment of a Figma breakpoint pair: mobile is
 * the base and `lg:` is desktop. The two differ by more than spacing — on mobile
 * the submit button is not inside the field at all, so the inline button below is
 * `hidden lg:inline-flex` and a mobile screen renders its own full-width button
 * underneath, which is what the mobile frame shows.
 *
 * Of the four states, Hover and Focus are CSS, and Error is the `invalid`/`error`
 * pair. Worth knowing before hunting for it: the set's `Focus` variant is
 * *pixel-identical to Default* apart from the input holding a value instead of a
 * placeholder — the design specifies no ring or border change on this field, so
 * none is implemented.
 *
 * Behaviour is `react-phone-number-input`, driven exactly as
 * components/ui/phone-input drives it: the country list, calling-code formatting,
 * per-country placeholder and locale labels are all its own.
 */

type CountrySelectOption = { label: string; value: RPNInput.Country };

/*
 * The design's chevron is Untitled UI's `chevron-down` at 16px. The project's icon
 * set has no stroked chevron — `caret-down` is a filled triangle, the wrong glyph
 * — and adding one via `generate:icons` rewrites the import formatting of every
 * existing icon, so the path is inlined here as it is in `phone-field.tsx`.
 */
const ChevronDown = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden className={cn('inline-block', className)}>
    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* Which glyph the submit button leads with, per the set's `Product` property. */
const PRODUCT_ICONS = {
  lookup: 'search',
  locate: 'locate',
} as const;

export type PhoneCtaProduct = keyof typeof PRODUCT_ICONS;

const CountrySelect = ({
  disabled,
  value,
  onChange,
  options,
  invalid,
}: {
  disabled?: boolean;
  value: RPNInput.Country;
  onChange: (value: RPNInput.Country) => void;
  options: CountrySelectOption[];
  invalid?: boolean;
}) => {
  const t = useTranslations('__NEW__.phone_cta_form');

  const handleSelect = React.useCallback((country: RPNInput.Country) => onChange(country), [onChange]);

  return (
    <Popover>
      {/*
       * The divider is the country block's own right border, and it turns red with
       * the rest of the field in the error state.
       */}
      <div
        className={cn(
          'flex h-6 shrink-0 items-center border-r border-border-primary pr-1',
          invalid && 'border-border-error',
        )}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={`
              flex h-full cursor-pointer items-center gap-1 rounded-sm px-1 font-body text-md-regular text-text-primary
              focus-visible:ring-2 focus-visible:ring-effects-focus-ring focus-visible:outline-hidden
              disabled:pointer-events-none disabled:text-text-disabled
              lg:px-3
              [&_svg]:shrink-0
            `}
          >
            {/*
             * 20px on mobile, 24px on desktop — the one size the two frames
             * disagree on. `Flag` takes a numeric `size` and writes it as inline
             * width/height, which no class can override, so the responsive step
             * has to be two nodes with one hidden rather than a `lg:size-6`.
             */}
            <span className="flex items-center justify-center lg:hidden">
              <Flag countryCode={value} size={20} />
            </span>
            <span className="hidden items-center justify-center lg:flex">
              <Flag countryCode={value} size={24} />
            </span>
            <span className="flex items-center justify-center gap-2 px-1">
              {value ? `+${RPNInput.getCountryCallingCode(value)}` : ''}
            </span>
            <ChevronDown className={cn('size-4 text-fg-quaternary', disabled && 'hidden')} />
          </button>
        </PopoverTrigger>
      </div>
      {/*
       * The dropdown panel has no Figma frame — the set only draws the closed
       * trigger — so its surface is styled from the new tokens by analogy with the
       * language dropdown, and the Command/Popover search behaviour is untouched.
       */}
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

const PhoneInputField = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      /*
       * No background of its own: Tailwind's preflight already makes form
       * controls transparent, so the field's surface shows through — which is
       * what lets the error state's pink reach the input. Spelling
       * `bg-transparent` here would also trip the migrated-path ratchet, because
       * the retiring theme restates Tailwind's own `transparent` keyword.
       */
      className={cn(
        `
          min-w-0 flex-1 border-none font-body text-md-regular text-text-primary outline-0
          placeholder:text-text-quaternary
        `,
        className,
      )}
      {...props}
    />
  ),
);
PhoneInputField.displayName = 'PhoneInputField';

const FlagComponent = ({ country }: RPNInput.FlagProps) => <Flag countryCode={country} />;

/*
 * The mobile-only usage badge ("1 / 5 today"). The set draws it with a trailing
 * arrow but binds no interaction to it, so it renders as static text; the copy is
 * the caller's because copy lives at call sites, not in the design system.
 */
const UsageBadge = ({ children }: { children: React.ReactNode }) => (
  <span
    className={`
      flex shrink-0 items-center gap-1 rounded-sm border border-utility-gray-200 bg-utility-gray-50 py-0.5 pr-1.5 pl-2
      font-body text-sm-medium text-utility-gray-700
      lg:hidden
    `}
  >
    {children}
    <Icon name="arrow-right" className="size-3 shrink-0" />
  </span>
);

export type PhoneCtaFormV2Props = {
  /* The set's `Product` property: chooses the submit button's leading glyph. */
  product?: PhoneCtaProduct;
  /*
   * Renders the inline submit button when set. It is `hidden lg:inline-flex`
   * because the mobile frame has no button inside the field — a mobile screen
   * renders its own beneath.
   */
  submitLabel?: React.ReactNode;
  loading?: boolean;
  /* The error message. Its presence turns the field red unless `invalid` says otherwise. */
  error?: React.ReactNode;
  invalid?: boolean;
  /* Mobile-only usage badge content, e.g. "1 / 5 today". */
  badge?: React.ReactNode;
  className?: string;
} & PhoneInputProps;

export const PhoneCtaFormV2: React.ForwardRefExoticComponent<PhoneCtaFormV2Props> = React.forwardRef<
  React.ElementRef<typeof RPNInput.default>,
  PhoneCtaFormV2Props
>(
  (
    { className, onChange, onSelectCountry, product = 'lookup', submitLabel, loading, error, invalid, badge, ...props },
    ref,
  ) => {
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

    const isInvalid = invalid ?? Boolean(error);

    const countrySelect = React.useCallback(
      (selectProps: {
        disabled?: boolean;
        value: RPNInput.Country;
        onChange: (value: RPNInput.Country) => void;
        options: CountrySelectOption[];
      }) => <CountrySelect {...selectProps} invalid={isInvalid} />,
      [isInvalid],
    );

    return (
      /* The error state stacks the message under the field; otherwise this is a plain wrapper. */
      <div className={cn('flex w-full flex-col items-start gap-2', className)}>
        <div
          className={cn(
            `
              flex h-14 w-full items-center gap-2 rounded-[4px] border border-border-primary bg-bg-primary py-2 pr-3
              pl-2
              hover:bg-bg-primary-hover
              lg:h-16 lg:gap-4 lg:rounded-md lg:p-2
            `,
            isInvalid && 'border-border-error bg-bg-error-primary hover:bg-bg-error-primary',
          )}
        >
          {/*
           * `contents` dissolves the library's own wrapper so the country trigger,
           * the input and the submit button are all direct children of the field —
           * which is the flat three-child auto-layout the design draws, and the
           * only way the container's own gap applies between all three.
           */}
          <RPNInput.default
            ref={ref}
            className="contents"
            flagComponent={FlagComponent}
            countrySelectComponent={countrySelect}
            inputComponent={PhoneInputField}
            defaultCountry={country as CountryCode}
            labels={labels}
            placeholder={placeholder}
            name="phoneNumber"
            aria-invalid={isInvalid || undefined}
            onChange={(value) => onChange?.(value || ('' as E164Number))}
            onCountryChange={handleCountryChange}
            {...props}
          />
          {badge ? <UsageBadge>{badge}</UsageBadge> : null}
          {submitLabel ? (
            <ButtonV2
              type="submit"
              size="xl"
              loading={loading}
              iconLeading={<Icon name={PRODUCT_ICONS[product]} />}
              className="hidden px-8 lg:inline-flex"
            >
              {submitLabel}
            </ButtonV2>
          ) : null}
        </div>
        {error ? <p className="font-body text-sm-regular text-text-error-primary">{error}</p> : null}
      </div>
    );
  },
);
PhoneCtaFormV2.displayName = 'PhoneCtaFormV2';
