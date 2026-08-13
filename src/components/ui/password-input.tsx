'use client';

import { Eye, EyeOff } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/libs/utils';

import { Input, type InputProps } from './input';
import { inputStyle } from './styles';

export type PasswordInputProps = Omit<InputProps, 'type'>;

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, disabled, value, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const Icon = isVisible ? EyeOff : Eye;

    React.useEffect(() => {
      if (value === '') {
        setIsVisible(false);
      }
    }, [value]);

    return (
      <div className="relative">
        <Input
          type={isVisible ? 'text' : 'password'}
          className={cn('pe-12', className)}
          disabled={disabled}
          ref={ref}
          value={value}
          {...props}
        />
        <button
          type="button"
          className={cn(
            'absolute inset-y-0 end-0 flex w-12 items-center justify-center',
            'rounded-e-lg text-gray-700 transition-colors',
            'hover:text-gray-1000 disabled:pointer-events-none disabled:text-gray-100',
            inputStyle,
            'w-12 border-0 bg-transparent p-0 hover:bg-transparent',
            'focus-visible:ring-2 active:bg-transparent',
          )}
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          aria-pressed={isVisible}
          disabled={disabled}
          onClick={() => setIsVisible(current => !current)}
        >
          <Icon className="size-5" aria-hidden="true" strokeWidth={2} />
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
