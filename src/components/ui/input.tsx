import * as React from 'react';

import { cn } from '@/libs/utils';

import { inputStyle } from './styles';

export type InputProps = {} & React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          inputStyle,
          `file:border-0 file:bg-transparent file:text-base file:font-medium file:text-foreground`,
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
