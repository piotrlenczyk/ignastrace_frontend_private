import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/libs/utils';

/*
 * `ring-offset-2` is scoped to `focus-visible:` rather than sitting unscoped.
 * In v3 the unscoped form was inert until a `ring-*` utility composited it; v4's
 * `ring-offset-*` sets `--tw-ring-offset-shadow` itself, so on every button that
 * also carries a `shadow-*` it painted a permanent 2px white ring that clipped
 * the drop shadow. Scoping it to the variant that turns the ring on reproduces
 * v3 exactly. See docs/tailwind-v4-migration-notes.md.
 */
const buttonVariants = cva(
  `
    inline-flex items-center justify-center gap-2 rounded-md text-center text-sm font-semibold transition-colors
    focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden
    active:fill-press
    disabled:pointer-events-none disabled:border-gray-100
    [&_svg]:pointer-events-none [&_svg]:shrink-0
  `,
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:shadow-raised disabled:bg-gray-100 disabled:shadow-none',
        brand: 'bg-brand text-brand-foreground hover:shadow-raised disabled:bg-gray-100 disabled:shadow-none',
        secondary: 'border border-primary text-primary hover:shadow-raised disabled:text-gray-100',
        tertiary: 'text-primary disabled:text-gray-100',
        inverse: 'shadow-raised focus-visible:ring-[currentColor] disabled:text-gray-100',
        destructive: 'bg-red text-background hover:shadow-raised disabled:bg-gray-100',
        outline: 'border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
        'outline-secondary': 'border border-primary bg-background text-primary',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        tranparent: '',
      },
      size: {
        default: 'min-h-10 px-4 py-2',
        sm: 'min-h-8 rounded-md px-3 py-1 text-xs',
        md: 'min-h-10 rounded-md px-4 py-2 text-sm/normal font-semibold lg:min-h-12 lg:text-base',
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
} & React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
