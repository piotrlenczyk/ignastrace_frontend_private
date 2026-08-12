import * as React from 'react';
import type { InputProps } from '@/components/ui/input';
import { cn } from '@/libs/utils';

export const InputComponent = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      className={cn('outline-0 flex-1 min-w-0 bg-transparent border-none placeholder:text-gray-700', className)}
      {...props}
      ref={ref}
    />
  ),
);

InputComponent.displayName = 'InputComponent'; 
