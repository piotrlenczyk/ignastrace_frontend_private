import React, { forwardRef } from 'react';

import { type TextColor } from '@/components/checkout/_shared/types/color.types';
import { cn } from '@/components/checkout/_shared/utils/style.utils';

export type TextVariant =
  | 'display'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'heading4'
  | 'heading5'
  | 'bodyLarge'
  | 'bodyDefault'
  | 'bodySmall'
  | 'caption';

const variantToTagMap: Record<TextVariant, string> = {
  display: 'h1',
  heading1: 'h1',
  heading2: 'h2',
  heading3: 'h3',
  heading4: 'h4',
  heading5: 'h5',
  bodyLarge: 'p',
  bodyDefault: 'p',
  bodySmall: 'p',
  caption: 'span',
};

const variantToFont: Record<TextVariant, string> = {
  display: 'font-heading',
  heading1: 'font-heading',
  heading2: 'font-heading',
  heading3: 'font-heading',
  heading4: 'font-heading',
  heading5: 'font-heading',
  bodyLarge: 'font-body',
  bodyDefault: 'font-body',
  bodySmall: 'font-body',
  caption: 'font-body',
};

const variantToSizeClassMap: Record<TextVariant, string> = {
  display: 'text-display',
  heading1: 'text-heading1',
  heading2: 'text-heading2',
  heading3: 'text-heading3',
  heading4: 'text-heading4',
  heading5: 'text-heading5',
  bodyLarge: 'text-body-large',
  bodyDefault: 'text-body-default',
  bodySmall: 'text-body-small',
  caption: 'text-caption',
};

const variantToWeightClassMap: Record<TextVariant, string> = {
  display: 'font-semibold',
  heading1: 'font-semibold',
  heading2: 'font-semibold',
  heading3: 'font-semibold',
  heading4: 'font-semibold',
  heading5: 'font-semibold',
  bodyLarge: 'font-normal',
  bodyDefault: 'font-normal',
  bodySmall: 'font-normal',
  caption: 'font-normal',
};

const colorToTextColorMap: Record<TextColor, `text-${TextColor}`> = {
  strong: 'text-strong',
  weak: 'text-weak',
  brand: 'text-brand',
  'brand-secondary': 'text-brand-secondary',
  disabled: 'text-disabled',
  error: 'text-error',
  warning: 'text-warning',
  success: 'text-success',
  information: 'text-information',
  'inverse-strong': 'text-inverse-strong',
  'inverse-weak': 'text-inverse-weak',
  'inverse-disabled': 'text-inverse-disabled',
};

export type TextProps = {
  variant?: TextVariant;
  as?: React.ElementType<Record<string, unknown>, 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div'>;
  color?: TextColor;
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  applyColor?: boolean;
  title?: string;
};

export const Text = forwardRef<HTMLElement, TextProps>(
  ({ className, variant = 'bodyDefault', color = 'strong', children, applyColor = true, as, title }, ref) => {
    const Component = as ?? (variantToTagMap[variant] || 'span');

    return (
      <Component
        ref={ref}
        className={cn(
          applyColor && colorToTextColorMap[color],
          variantToSizeClassMap[variant],
          variantToWeightClassMap[variant],
          variantToFont[variant],
          className,
        )}
        title={title}
      >
        {children}
      </Component>
    );
  },
);

Text.displayName = 'Text';
