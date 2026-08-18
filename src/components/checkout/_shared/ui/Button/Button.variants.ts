import { cva, type VariantProps } from 'class-variance-authority';

export const buttonVariants = cva(
  `
    group inline-flex items-center justify-center rounded-lg border
    font-semibold transition-colors
    disabled:pointer-events-none disabled:cursor-default
    [&>.state]:inline-flex [&>.state]:w-full [&>.state]:items-center
    [&>.state]:justify-center [&>.state]:transition-all
  `,
  {
    variants: {
      primary: {
        brand: `
          border-fill-brand-strong bg-fill-brand-strong text-inverse-strong
          hover:shadow-raised
          focus:shadow-raised focus:outline-2 focus:outline-offset-2
          focus:outline-stroke-focus focus:outline-solid
          disabled:opacity-40
          [&>.state]:hover:bg-fill-inverse-hover [&>.state]:active:bg-fill-press
        `,
        neutral: `
          bg-fill-strong text-inverse-strong
          hover:shadow-raised
          focus:shadow-raised focus:outline-2 focus:outline-offset-2
          focus:outline-stroke-focus focus:outline-solid
          disabled:bg-fill-disabled
          [&>.state]:hover:bg-fill-inverse-hover [&>.state]:active:bg-fill-press
        `,
        destructive: `
          border-fill-error-strong bg-fill-error-strong text-inverse-strong
          hover:shadow-raised
          focus:shadow-raised focus:outline-2 focus:outline-offset-2
          focus:outline-stroke-focus focus:outline-solid
          disabled:border-transparent disabled:bg-fill-disabled
          [&>.state]:hover:bg-fill-inverse-hover [&>.state]:active:bg-fill-press
        `,
        inverse: `
          border-fill-inverse-strong bg-fill-inverse-strong text-strong
          hover:shadow-raised
          focus:shadow-raised focus:outline-2 focus:outline-offset-2
          focus:outline-stroke-inverse-strong focus:outline-solid
          active:bg-fill-inverse-strong
          disabled:border-transparent disabled:bg-fill-inverse-disabled
          [&>.state]:hover:bg-fill-hover [&>.state]:active:bg-fill-press
        `,
      },
      secondary: {
        brand: `
          border-stroke-brand-strong text-brand
          hover:bg-fill-hover hover:shadow-raised
          focus:shadow-raised focus:outline-2 focus:outline-offset-2
          focus:outline-stroke-focus focus:outline-solid
          active:bg-fill-press
          disabled:border-stroke-disabled disabled:text-disabled
          data-[loading=true]:bg-fill-press
        `,
        neutral: `
          border-stroke-strong text-weak
          hover:bg-fill-hover hover:shadow-raised
          focus:shadow-raised focus:outline-2 focus:outline-offset-2
          focus:outline-stroke-focus focus:outline-solid
          active:bg-fill-press
          disabled:border-stroke-disabled disabled:text-disabled
          data-[loading=true]:bg-fill-press
        `,
        destructive: `
          border-stroke-error-strong text-error
          hover:bg-fill-hover hover:shadow-raised
          focus:shadow-raised focus:outline-2 focus:outline-offset-2
          focus:outline-stroke-focus focus:outline-solid
          active:bg-fill-press
          disabled:border-stroke-disabled disabled:text-disabled
          data-[loading=true]:bg-fill-press
        `,
        inverse: `
          border-stroke-inverse-strong text-inverse-strong
          hover:bg-fill-inverse-hover hover:shadow-raised
          focus:shadow-raised focus:outline-2 focus:outline-offset-2
          focus:outline-stroke-inverse-strong focus:outline-solid
          active:bg-fill-inverse-press
          disabled:border-stroke-disabled disabled:text-disabled
          data-[loading=true]:bg-fill-press
        `,
      },
      tertiary: {
        brand: `
          border-transparent text-brand
          hover:bg-fill-hover
          focus:outline-2 focus:outline-offset-2 focus:outline-stroke-focus
          focus:outline-solid
          active:bg-fill-press
          disabled:text-disabled
          data-[loading=true]:bg-fill-press
        `,
        neutral: `
          border-transparent text-weak
          hover:bg-fill-hover
          focus:outline-2 focus:outline-offset-2 focus:outline-stroke-focus
          focus:outline-solid
          active:bg-fill-press
          disabled:text-disabled
          data-[loading=true]:bg-fill-press
        `,
        destructive: `
          border-transparent text-error
          hover:bg-fill-hover
          focus:outline-2 focus:outline-offset-2 focus:outline-stroke-focus
          focus:outline-solid
          active:bg-fill-press
          disabled:text-disabled
          data-[loading=true]:bg-fill-press
        `,
        inverse: `
          border-transparent text-inverse-strong
          hover:bg-fill-inverse-hover
          focus:outline-2 focus:outline-offset-2
          focus:outline-stroke-inverse-strong focus:outline-solid
          active:bg-fill-inverse-press
          disabled:text-disabled
          data-[loading=true]:bg-fill-press
        `,
      },
      buttonSize: {
        sm: `
          h-10 text-body-small
          [&>.state]:h-10 [&>.state]:px-4
        `,
        md: `
          h-14 text-body-default
          [&>.state]:h-14 [&>.state]:px-5
        `,
        lg: `
          h-14 text-body-large font-bold
          [&>.state]:h-14 [&>.state]:px-7
        `,
      },
      iconButtonSize: {
        sm: `
          size-8
          [&>.state]:size-8
        `,
        md: `
          size-12
          [&>.state]:size-12
        `,
      },
    },
  } as const,
);

export type ButtonVariant = keyof Omit<VariantProps<typeof buttonVariants>, 'buttonSize' | 'iconButtonSize'>;

export type ButtonColor = NonNullable<VariantProps<typeof buttonVariants>['primary']>;

export type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>['buttonSize']>;

export type IconButtonVariant = keyof Omit<VariantProps<typeof buttonVariants>, 'buttonSize' | 'iconButtonSize'>;

export type IconButtonColor = NonNullable<VariantProps<typeof buttonVariants>['primary']>;

export type IconButtonSize = NonNullable<VariantProps<typeof buttonVariants>['iconButtonSize']>;
