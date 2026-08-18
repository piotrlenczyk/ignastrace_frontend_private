import React from 'react';

import { type IconsName } from '@/components/checkout/_shared/types/icons.types';
import { cn } from '@/components/checkout/_shared/utils/style.utils';

import { Icon } from '../Icon';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  small?: boolean;
  isError?: boolean;
  hidden?: boolean;
  leftIcon?: IconsName;
  rightIcon?: IconsName;
  onRightIconClick?: () => void;
  rightIconLabel?: string;
};

export const useInputStyles = ({
  leftIcon,
  isError,
  className = '',
  rightIcon,
}: {
  leftIcon?: boolean;
  rightIcon?: boolean;
  isError?: boolean;
  className?: string;
}) => {
  return cn(
    `
      h-full w-full rounded-lg bg-background-base px-3 text-body-default
      text-strong ring-1 ring-stroke-strong transition-colors ring-inset
      placeholder:text-disabled
      hover:placeholder:text-weak
      focus:ring-2 focus:ring-stroke-focus focus:outline-hidden
      focus:placeholder:text-weak
      disabled:pointer-events-none disabled:opacity-50
    `,
    {
      'pl-10': !!leftIcon,
      'pr-10': !!rightIcon,
      'bg-fill-error-weak ring-2 ring-stroke-error-strong focus:ring-stroke-error-strong': isError,
    },
    className,
  );
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      leftIcon,
      disabled = false,
      hidden = false,
      className,
      isError,
      rightIcon,
      onRightIconClick,
      rightIconLabel,
      ...props
    },
    ref,
  ) => {
    const inputStyles = useInputStyles({
      leftIcon: !!leftIcon,
      rightIcon: !!rightIcon,
      className,
      isError,
    });

    return (
      <div
        className={cn('relative h-12 w-full', {
          'fixed -z-10 hidden h-0 w-0': hidden,
        })}
      >
        {leftIcon && (
          <div
            className={cn(`
              pointer-events-none absolute inset-y-0 left-0 inline-flex pl-3
            `)}
          >
            <Icon name={leftIcon} className={'transition'} color="weak" />
          </div>
        )}
        <input ref={ref} disabled={disabled} className={inputStyles} {...props} />
        {rightIcon &&
          (onRightIconClick ? (
            <button
              type="button"
              aria-label={rightIconLabel}
              disabled={disabled}
              onMouseDown={(e) => e.preventDefault()}
              onClick={onRightIconClick}
              className={cn(`
                absolute inset-y-0 right-0 inline-flex items-center pr-3
                disabled:pointer-events-none disabled:opacity-50
              `)}
            >
              <Icon name={rightIcon} className={'transition'} color="brand" />
            </button>
          ) : (
            <div
              className={cn(`
                pointer-events-none absolute inset-y-0 right-0 inline-flex pr-3
              `)}
            >
              <Icon name={rightIcon} className={'transition'} color="brand" />
            </div>
          ))}
      </div>
    );
  },
);

Input.displayName = 'Input';
