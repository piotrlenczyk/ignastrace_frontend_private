import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/libs/utils';

/*
 * The new-design Button — `Buttons/Button` (10003:10813) in the Figma file.
 *
 * Every variant, size and state below was read off that component set node by
 * node; none of it is extrapolated from Untitled UI's published taxonomy. The
 * set declares exactly four properties, and the props here carry their names:
 *
 *   Size       sm | md | lg | xl
 *   Hierarchy  Primary | Secondary | Tertiary | Link color | Link gray
 *   Icon only  true | false          (Primary/Secondary/Tertiary only)
 *   State      Default | Hover | Focused | Disabled | Loading
 *
 * `State` is not a prop: Hover, Focused and Disabled are CSS states, and
 * Loading is the `loading` prop. The set defines no pressed/active state and no
 * destructive modifier, so neither is implemented — see the ADR-less note in the
 * report rather than adding one speculatively.
 *
 * Radius is 4px (`radius-xs`). `rounded-xs` is 2px in this theme and
 * `rounded-sm` is 6px, so 4px has no named step — hence the arbitrary value.
 */
const buttonVariants = cva(
  `
    inline-flex shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-[4px] font-body
    transition-colors
    focus-visible:ring-2 focus-visible:ring-effects-focus-ring focus-visible:ring-offset-2
    focus-visible:ring-offset-bg-primary focus-visible:outline-hidden
    disabled:pointer-events-none
    [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0
  `,
  {
    /*
     * `size` is declared before `hierarchy` on purpose. The link hierarchies
     * reset padding to `p-0`, and cva emits variant classes in key order, so the
     * reset has to land after the size's `px-*`/`py-*` for `cn`'s token-aware
     * merge to keep it.
     */
    variants: {
      /*
       * Icons are 20px in every size — the set never scales them. The design's
       * frame heights (36/40/44/48) are exactly line-height + 2 × py.
       */
      size: {
        sm: 'gap-1 px-3 py-2 text-sm-semibold',
        md: 'gap-1 px-3.5 py-2.5 text-sm-semibold',
        lg: 'gap-1.5 px-4 py-2.5 text-md-semibold',
        xl: 'gap-1.5 px-4.5 py-3 text-md-semibold',
      },
      hierarchy: {
        /*
         * Strokes are `inset-ring`, not `border`. Figma draws a frame's stroke on
         * the boundary, so its 36/40/44/48 heights already include it; a CSS
         * border would add its 1px to the box and make every bordered hierarchy
         * 2px taller than the design. An inset ring is painted inside and costs
         * no layout, which also means Primary needs no transparent placeholder to
         * keep its geometry stable as it disables itself.
         */
        primary: `
          bg-bg-brand-solid text-text-white
          hover:bg-bg-brand-solid-hover
          disabled:bg-bg-disabled disabled:text-fg-disabled disabled:inset-ring-1
          disabled:inset-ring-border-disabled-subtle
          [&_svg]:text-components-button-primary-icon
          hover:[&_svg]:text-components-button-primary-icon-hover
          disabled:[&_svg]:text-fg-disabled
        `,
        /* Secondary keeps its white surface when disabled; only the stroke and text change. */
        secondary: `
          bg-bg-primary text-text-secondary inset-ring-1 inset-ring-border-primary
          hover:bg-bg-primary-hover hover:text-text-secondary-hover
          disabled:bg-bg-primary disabled:text-fg-disabled disabled:inset-ring-border-disabled-subtle
          [&_svg]:text-fg-quaternary
          hover:[&_svg]:text-fg-quaternary-hover
          disabled:[&_svg]:text-fg-disabled
        `,
        /* Tertiary has no stroke in any state, and gains no surface when disabled. */
        tertiary: `
          text-text-tertiary
          hover:bg-bg-primary-hover hover:text-text-tertiary-hover
          disabled:text-fg-disabled
          [&_svg]:text-fg-quaternary
          hover:[&_svg]:text-fg-quaternary-hover
          disabled:[&_svg]:text-fg-disabled
        `,
        /*
         * Both link hierarchies underline on hover, and the two decoration
         * properties are the design's own. They differ in one respect that is
         * easy to assume away: Link color keeps its text colour on hover and only
         * the icon shifts, while Link gray darkens its text as well.
         */
        'link-color': `
          p-0 text-text-brand-secondary [text-decoration-skip-ink:none] [text-underline-position:from-font]
          hover:underline
          disabled:text-fg-disabled disabled:no-underline
          [&_svg]:text-fg-brand-secondary
          hover:[&_svg]:text-fg-brand-secondary-hover
          disabled:[&_svg]:text-fg-disabled
        `,
        'link-gray': `
          p-0 text-text-tertiary [text-decoration-skip-ink:none] [text-underline-position:from-font]
          hover:text-text-tertiary-hover hover:underline
          disabled:text-fg-disabled disabled:no-underline
          [&_svg]:text-fg-quaternary
          hover:[&_svg]:text-fg-quaternary-hover
          disabled:[&_svg]:text-fg-disabled
        `,
      },
      iconOnly: {
        true: '',
        false: '',
      },
      loading: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      /* The link hierarchies set their label in medium, not semibold. */
      { hierarchy: ['link-color', 'link-gray'], size: 'sm', class: 'text-sm-medium' },
      { hierarchy: ['link-color', 'link-gray'], size: 'md', class: 'text-sm-medium' },
      { hierarchy: ['link-color', 'link-gray'], size: 'lg', class: 'text-md-medium' },
      { hierarchy: ['link-color', 'link-gray'], size: 'xl', class: 'text-md-medium' },

      /*
       * Icon-only is a square: 20px icon plus even padding, giving the same
       * 36/40/44/48 as the labelled sizes. The set defines it for the three box
       * hierarchies only, so a link left icon-only simply stays a bare link.
       */
      { hierarchy: ['primary', 'secondary', 'tertiary'], iconOnly: true, size: 'sm', class: 'p-2' },
      { hierarchy: ['primary', 'secondary', 'tertiary'], iconOnly: true, size: 'md', class: 'p-2.5' },
      { hierarchy: ['primary', 'secondary', 'tertiary'], iconOnly: true, size: 'lg', class: 'p-3' },
      { hierarchy: ['primary', 'secondary', 'tertiary'], iconOnly: true, size: 'xl', class: 'p-3.5' },

      /*
       * Loading takes each hierarchy's *hover* surface — that is uniform across
       * the set — while the label and icon keep their default colours.
       *
       * These have to be spelled under `disabled:` because a loading button sets
       * the `disabled` attribute (so it cannot be clicked or submit a form
       * twice), and a bare `bg-*` would lose to the hierarchy's own
       * `disabled:bg-*` on specificity rather than on order.
       */
      {
        hierarchy: 'primary',
        loading: true,
        class: `
          disabled:bg-bg-brand-solid-hover disabled:text-text-white disabled:inset-ring-0
          disabled:[&_svg]:text-components-button-primary-icon
        `,
      },
      {
        hierarchy: 'secondary',
        loading: true,
        class: `
          disabled:bg-bg-primary-hover disabled:text-text-secondary disabled:inset-ring-border-primary
          disabled:[&_svg]:text-fg-quaternary
        `,
      },
      {
        hierarchy: 'tertiary',
        loading: true,
        class: 'disabled:bg-bg-primary-hover disabled:text-text-tertiary disabled:[&_svg]:text-fg-quaternary',
      },
      {
        hierarchy: 'link-color',
        loading: true,
        class: 'disabled:text-text-brand-secondary disabled:[&_svg]:text-fg-brand-secondary',
      },
      {
        hierarchy: 'link-gray',
        loading: true,
        class: 'disabled:text-text-tertiary disabled:[&_svg]:text-fg-quaternary',
      },
    ],
    defaultVariants: {
      hierarchy: 'primary',
      size: 'md',
      iconOnly: false,
      loading: false,
    },
  },
);

/*
 * The design's loading icon, on `currentColor` so it inherits whichever
 * `[&_svg]:text-*` rule the hierarchy sets — which is why it is correct in all
 * five without a variant of its own. The shared `ui/v2/spinner` is left alone:
 * it pins a legacy `border-brand` colour and could not follow the foreground.
 */
const ButtonSpinner = () => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden className="animate-spin">
    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
    <path d="M18 10a8 8 0 0 0-8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export type ButtonV2Props = {
  asChild?: boolean;
  /*
   * Icons are props rather than children because the design puts a 2px box
   * around the label (`Text padding` in the set). With free-form children there
   * is no way to tell label from icon, so the inset would have to be folded into
   * the padding — which comes out right for a text-only button and up to 4px wide
   * for one with icons. Modelling `iconLeading`/`iconTrailing` the way the Figma
   * component does keeps every measurement exact.
   */
  iconLeading?: React.ReactNode;
  iconTrailing?: React.ReactNode;
  /*
   * `State=Loading`: swaps the leading icon for a spinner, drops the trailing
   * icon, and disables the button. `loadingLabel` is the set's `loadingText`
   * property — omit it to keep the button's own label, pass `null` for a spinner
   * on its own.
   */
  loadingLabel?: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

const ButtonV2 = React.forwardRef<HTMLButtonElement, ButtonV2Props>(
  (
    {
      className,
      size,
      hierarchy,
      iconOnly,
      loading,
      loadingLabel,
      iconLeading,
      iconTrailing,
      asChild = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';
    const isLink = hierarchy === 'link-color' || hierarchy === 'link-gray';
    const label = loading && loadingLabel !== undefined ? loadingLabel : children;

    /*
     * `asChild` hands the whole content to the caller's element — Slot takes a
     * single child, so the label box and the icon slots cannot be composed around
     * it. A link passed through `asChild` is a link hierarchy in practice, which
     * carries no label box anyway.
     */
    const content = asChild ? (
      children
    ) : iconOnly ? (
      loading ? (
        <ButtonSpinner />
      ) : (
        (iconLeading ?? children)
      )
    ) : (
      <>
        {loading ? <ButtonSpinner /> : iconLeading}
        {label !== null &&
          label !== undefined &&
          (isLink ? label : <span className="flex items-center justify-center px-0.5">{label}</span>)}
        {!loading && iconTrailing}
      </>
    );

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ size, hierarchy, iconOnly, loading }), className)}
        disabled={disabled || loading || undefined}
        aria-busy={loading || undefined}
        {...props}
      >
        {content}
      </Comp>
    );
  },
);
ButtonV2.displayName = 'ButtonV2';

export { ButtonV2, buttonVariants };
