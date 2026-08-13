import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/libs/utils';

/*
 * The new-design Button.
 *
 * `hierarchy` and `size` follow Untitled UI's property names so that a designer
 * saying "the secondary-gray md button" and this prop pair name the same thing.
 * The Figma component set itself lives in the shared "Corporate Design System"
 * library, which needs `search_design_system` to enumerate — that tool is not
 * allowlisted in this environment, so the variants below come from the instances
 * the Reverse Lookup frame actually binds (primary Lookup, secondary-gray Log in,
 * link-gray nav items) laid out on Untitled UI's published taxonomy. Anything
 * beyond those three is taxonomy rather than read off the file; confirm against
 * the component set before relying on it for a new screen.
 *
 * Radius is 4px (`radius-xs`) rather than Untitled UI's usual 8px because that is
 * what this design file binds on every button. `rounded-xs` is 2px in this theme
 * and `rounded-sm` is 6px, so 4px has no named step — hence the arbitrary value.
 */
const buttonVariants = cva(
  `
    inline-flex shrink-0 cursor-pointer items-center justify-center gap-1 rounded-[4px] font-body transition-colors
    focus-visible:ring-2 focus-visible:ring-effects-focus-ring focus-visible:ring-offset-2 focus-visible:outline-hidden
    disabled:pointer-events-none
    [&_svg]:pointer-events-none [&_svg]:shrink-0
  `,
  {
    variants: {
      hierarchy: {
        primary: `
          bg-bg-brand-solid text-text-primary-on-brand shadow-uui-xs
          hover:bg-bg-brand-solid-hover
          disabled:bg-bg-disabled disabled:text-text-disabled disabled:shadow-none
        `,
        'secondary-gray': `
          border border-border-primary bg-bg-primary text-text-secondary shadow-uui-xs
          hover:bg-bg-primary-hover hover:text-text-secondary-hover
          disabled:border-border-disabled-subtle disabled:bg-bg-primary disabled:text-text-disabled disabled:shadow-none
        `,
        'secondary-color': `
          border border-border-brand bg-bg-primary text-text-brand-secondary shadow-uui-xs
          hover:bg-bg-brand-primary
          disabled:border-border-disabled-subtle disabled:bg-bg-primary disabled:text-text-disabled disabled:shadow-none
        `,
        'tertiary-gray': `
          text-text-tertiary
          hover:bg-bg-primary-hover hover:text-text-tertiary-hover
          disabled:bg-transparent disabled:text-text-disabled
        `,
        'link-gray': `text-text-tertiary hover:text-text-tertiary-hover disabled:text-text-disabled`,
        /*
         * Untitled UI's link-color hover is `text-brand-secondary-hover`, which
         * the export does not carry. `text-brand-primary` is the next step down
         * the same ramp (primary-900 against secondary's primary-700), so it
         * darkens on hover as intended without inventing a token.
         */
        'link-color': `text-text-brand-secondary hover:text-text-brand-primary disabled:text-text-disabled`,
      },
      size: {
        sm: 'px-3 py-2 text-sm-semibold',
        md: 'px-3.5 py-2.5 text-sm-semibold',
        lg: 'px-4 py-2.5 text-md-semibold',
        xl: 'px-4.5 py-3 text-md-semibold',
        '2xl': 'gap-2.5 px-5.5 py-4 text-lg-semibold',
      },
      destructive: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      /*
       * Destructive is a modifier in Untitled UI rather than a hierarchy of its
       * own, so it composes with each hierarchy instead of replacing it. Spelling
       * the pairs out keeps `hierarchy` and `destructive` independent props — a
       * single merged `variant` list would force every caller to know that
       * "destructive secondary-gray" is a legal combination.
       */
      {
        hierarchy: 'primary',
        destructive: true,
        class: 'bg-bg-error-solid hover:bg-bg-error-solid-hover',
      },
      {
        hierarchy: 'secondary-gray',
        destructive: true,
        class: 'border-border-error-subtle text-text-error-primary hover:bg-bg-error-primary',
      },
      {
        hierarchy: 'secondary-color',
        destructive: true,
        class: 'border-border-error text-text-error-primary hover:bg-bg-error-primary',
      },
      {
        hierarchy: 'tertiary-gray',
        destructive: true,
        class: 'text-text-error-primary hover:bg-bg-error-primary',
      },
      {
        hierarchy: 'link-gray',
        destructive: true,
        class: 'text-text-error-primary',
      },
      {
        hierarchy: 'link-color',
        destructive: true,
        class: 'text-text-error-primary hover:text-text-error-primary-hover',
      },
      /*
       * The link hierarchies are typographic — Untitled UI gives them no padding
       * and no min-height, so the size variant may only set type on them. Without
       * this the nav items would carry a button's padding and the header's 24px
       * auto-layout gap would read as ~56px.
       */
      { hierarchy: 'link-gray', size: 'sm', class: 'p-0' },
      { hierarchy: 'link-gray', size: 'md', class: 'p-0' },
      { hierarchy: 'link-gray', size: 'lg', class: 'p-0' },
      { hierarchy: 'link-gray', size: 'xl', class: 'p-0' },
      { hierarchy: 'link-gray', size: '2xl', class: 'p-0' },
      { hierarchy: 'link-color', size: 'sm', class: 'p-0' },
      { hierarchy: 'link-color', size: 'md', class: 'p-0' },
      { hierarchy: 'link-color', size: 'lg', class: 'p-0' },
      { hierarchy: 'link-color', size: 'xl', class: 'p-0' },
      { hierarchy: 'link-color', size: '2xl', class: 'p-0' },
    ],
    defaultVariants: {
      hierarchy: 'primary',
      size: 'md',
      destructive: false,
    },
  },
);

export type ButtonV2Props = {
  asChild?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

const ButtonV2 = React.forwardRef<HTMLButtonElement, ButtonV2Props>(
  ({ className, hierarchy, size, destructive, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    return <Comp className={cn(buttonVariants({ hierarchy, size, destructive }), className)} ref={ref} {...props} />;
  },
);
ButtonV2.displayName = 'ButtonV2';

export { ButtonV2, buttonVariants };
