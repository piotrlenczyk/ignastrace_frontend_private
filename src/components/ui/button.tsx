import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/libs/utils';

const buttonVariants = cva(
  `
  active:fill-press 
  inline-flex items-center justify-center gap-2 text-center
  rounded-md text-sm font-semibold
  ring-offset-2 transition-colors 
  focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring 
  disabled:pointer-events-none disabled:border-gray-100 
  [&_svg]:pointer-events-none 
  [&_svg]:shrink-0
`,
  {
    variants: {
      variant: {
        default:
          'hover:shadow-raised bg-primary text-primary-foreground disabled:bg-gray-100 disabled:shadow-none',
        brand:
          'hover:shadow-raised bg-brand text-brand-foreground disabled:bg-gray-100 disabled:shadow-none',
        secondary:
          'hover:shadow-raised border border-primary text-primary disabled:text-gray-100',
        tertiary: 'text-primary disabled:text-gray-100',
        inverse: 'shadow-raised focus-visible:ring-[currentColor] disabled:text-gray-100',
        destructive: 'hover:shadow-raised bg-red text-background disabled:bg-gray-100',
        outline:
          'border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
        'outline-secondary':
          'border border-primary text-primary bg-background', 
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        tranparent: '',
      },
      size: {
        default: 'min-h-10 px-4 py-2',
        sm: 'min-h-8 rounded-md px-3 py-1 text-xs',
        md: 'min-h-10 lg:min-h-12 rounded-md px-4 py-2 text-sm/normal lg:text-base font-semibold',
        lg: 'min-h-12 rounded-lg px-6 py-2 text-lg/tight font-semibold',
        xl: 'min-h-14 rounded-lg px-6 py-2 text-lg/tight font-semibold',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export type ButtonProps = {
  asChild?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
