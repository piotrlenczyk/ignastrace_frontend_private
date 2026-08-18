'use client';

import Link from 'next/link';
import React, { type ComponentProps, type ReactNode } from 'react';

import { type IconsName } from '@/components/checkout/_shared/types/icons.types';
import { cn } from '@/components/checkout/_shared/utils/style.utils';

import { Icon } from '../Icon';
import { Spinner } from '../Spinner';
import { type ButtonColor, type ButtonSize, type ButtonVariant, buttonVariants } from './Button.variants';

type AsProp = 'button' | 'link' | 'label';

type ButtonElementType<TElement extends AsProp = 'button'> = TElement extends 'link'
  ? 'a'
  : TElement extends 'label'
    ? 'label'
    : 'button';

type BaseButtonProps<TElement extends AsProp> = {
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
  children: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: IconsName;
  rightIcon?: IconsName;
  disableFocus?: boolean;
  as?: TElement;
  lineClamp?: boolean;
};

type ButtonButtonProps = React.ComponentPropsWithoutRef<'button'>;

export type ButtonProps<TElement extends AsProp = AsProp> = BaseButtonProps<TElement> &
  React.ComponentPropsWithoutRef<TElement extends 'link' ? 'a' : TElement>;

export const Button = React.forwardRef(
  <TElement extends AsProp = 'button'>(
    {
      variant = 'primary',
      color = 'brand',
      size = 'md',
      disabled = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      className,
      disableFocus = false,
      as: asProp,
      lineClamp = true,
      ...rest
    }: ButtonProps<TElement>,
    ref?: React.ForwardedRef<React.ElementRef<ButtonElementType<TElement>>>,
  ) => {
    const as = asProp ?? 'button';

    const renderContent = () => {
      return (
        <span className="state relative block">
          {loading && (
            <span className={`absolute inset-0 flex items-center justify-center`}>
              <Spinner className="text-inherit" />
            </span>
          )}
          <span
            className={cn('flex items-center justify-center gap-2', {
              'opacity-0': loading,
            })}
          >
            {leftIcon && (
              <Icon
                name={leftIcon}
                applyColor={false}
                className={cn('size-5 shrink-0', {
                  'size-4': size === 'sm',
                })}
              />
            )}
            {lineClamp ? <span className="line-clamp-2">{children}</span> : children}
            {rightIcon && (
              <Icon
                name={rightIcon}
                applyColor={false}
                className={cn('size-5 shrink-0', {
                  'size-4': size === 'sm',
                })}
              />
            )}
          </span>
        </span>
      );
    };

    const styles = cn(
      buttonVariants({
        [variant]: color,
        buttonSize: size,
        className: [
          className,
          {
            'pointer-events-none': loading,
            'focus:outline-0': disableFocus,
          },
          'inline-flex items-center justify-center',
        ],
      }),
    );

    if (as === 'link') {
      const linkProps = rest as unknown as ComponentProps<typeof Link>;
      const linkRef = ref as React.ForwardedRef<HTMLAnchorElement>;

      return (
        <Link ref={linkRef} className={styles} {...linkProps}>
          {renderContent()}
        </Link>
      );
    }

    if (as === 'label') {
      const labelProps = rest as React.LabelHTMLAttributes<HTMLLabelElement>;
      const labelRef = ref as React.ForwardedRef<HTMLLabelElement>;

      return (
        <label ref={labelRef} className={styles} {...labelProps}>
          {renderContent()}
        </label>
      );
    }

    if (as === 'button') {
      const buttonProps = rest as ButtonButtonProps;
      const buttonRef = ref as React.ForwardedRef<HTMLButtonElement>;

      return (
        <button ref={buttonRef} disabled={disabled} className={styles} data-loading={loading} {...buttonProps}>
          {renderContent()}
        </button>
      );
    }

    return null;
  },
);
Button.displayName = 'Button';
