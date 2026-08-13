# Building a v2 component

Read this before writing anything in `src/components/ui/v2/`.

A screen needs three button variants and you have the whole Figma component set in front of
you. Build the set. The next screen needs the fourth variant, and discovering that later
means reopening a component someone has reviewed and re-deriving decisions you had the
design open for. The variant matrix is also where a design system either becomes real or
stays a pile of one-off classes, and this is the moment it gets decided.

## Contents

- [Where things go](#where-things-go)
- [Reading a Figma component set](#reading-a-figma-component-set)
- [The shape](#the-shape)
- [States are variants of the same class list](#states-are-variants-of-the-same-class-list)
- [Icons](#icons)
- [Radix and behaviour](#radix-and-behaviour)
- [Checklist](#checklist)

## Where things go

`src/components/ui/v2/<component>.tsx`, one component per file, kebab-case, matching the
Figma component name (`button.tsx`, `badge.tsx`, `input-field.tsx`).

`src/components/ui` is the legacy design system and is frozen. Do not add a new-design
variant to a legacy component's variant list even when it looks like the smaller change —
the legacy component is still rendered by every screen not yet rebuilt, and the two systems
are kept apart precisely so that the old directory can be deleted whole at the end rather
than untangled. ADR 0005 has the reasoning.

## Reading a Figma component set

A Figma component set's **properties** are the cva variants; its **values** are the variant
keys. Get them from `get_design_context` on the component set node — not from the one instance
on your screen, which shows a single combination and tells you nothing about the rest.

The translation is usually direct:

| Figma property                              | cva variant                                   |
| ------------------------------------------- | --------------------------------------------- |
| `Hierarchy`: Primary / Secondary / Tertiary | `hierarchy: { primary, secondary, tertiary }` |
| `Size`: sm / md / lg / xl                   | `size: { sm, md, lg, xl }`                    |
| `Destructive`: true / false                 | `destructive: { true: …, false: '' }`         |
| `Icon`: leading / trailing / only / none    | `icon` — or a prop, see below                 |

Keep the Figma names. `hierarchy` rather than `variant` when Figma says Hierarchy, `sm`
rather than `small`. The point is that a designer saying "the secondary md button" and a
developer reading `hierarchy="secondary" size="md"` are provably talking about the same
thing, and any renaming — however tidier — puts a translation step between them that has to
be maintained in someone's head.

Two properties do **not** become variants:

- **State** (default / hover / focused / disabled) — these are CSS states, not props. See
  below.
- **Boolean content toggles** like `Icon: true` — usually better as the presence of a
  `children`/`icon` prop than as a variant, because the caller passes the icon anyway.

## The shape

`src/components/ui/button.tsx` is the established shape in this repo — cva plus
`React.forwardRef` plus `cn`. Copy the shape, not the classes; those are legacy tokens.

```tsx
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/libs/utils';

const buttonVariants = cva(
  `
    inline-flex items-center justify-center gap-2 rounded-lg font-body transition-colors
    focus-visible:ring-2 focus-visible:ring-effects-focus-ring focus-visible:outline-hidden
    disabled:pointer-events-none
    [&_svg]:pointer-events-none [&_svg]:shrink-0
  `,
  {
    variants: {
      hierarchy: {
        primary: `
          bg-bg-brand-solid text-text-primary-on-brand
          hover:bg-bg-brand-solid-hover
          disabled:bg-bg-disabled disabled:text-text-disabled
        `,
        secondary: `
          border border-border-primary bg-bg-primary text-text-secondary
          hover:bg-bg-primary-hover hover:text-text-secondary-hover
          disabled:border-border-disabled-subtle disabled:bg-bg-primary disabled:text-text-disabled
        `,
        tertiary: `
          text-text-tertiary
          hover:bg-bg-primary-hover
          disabled:text-text-disabled
        `,
        link: `
          text-text-brand-secondary underline-offset-4
          hover:underline
          disabled:text-text-disabled
        `,
      },
      size: {
        sm: 'min-h-9 px-3 py-2 text-sm-semibold',
        md: 'min-h-10 px-3.5 py-2.5 text-sm-semibold',
        lg: 'min-h-11 px-4 py-2.5 text-md-semibold',
        xl: 'min-h-12 px-4.5 py-3 text-md-semibold',
      },
      destructive: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      /*
       * Destructive is a modifier in Figma rather than a hierarchy of its own, so
       * it has to compose with each hierarchy instead of replacing it. Spelling
       * the combinations out here is what keeps `hierarchy` and `destructive`
       * independent props — collapsing them into one `variant` list would force
       * the caller to know that "destructive secondary" is a thing.
       */
      {
        hierarchy: 'primary',
        destructive: true,
        class: 'bg-bg-error-solid hover:bg-bg-error-solid-hover',
      },
      {
        hierarchy: 'secondary',
        destructive: true,
        class: 'text-text-error-primary hover:text-text-error-primary-hover',
      },
    ],
    defaultVariants: {
      hierarchy: 'primary',
      size: 'md',
      destructive: false,
    },
  },
);

export type ButtonProps = {
  asChild?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, hierarchy, size, destructive, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ hierarchy, size, destructive, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

`defaultVariants` mirrors the Figma set's default — the variant the component shows when you
drop it on a canvas — so that `<Button>` with no props renders what a designer would expect.

Compose through `cn`, never by string concatenation: `cn` is `tailwind-merge` configured for
this project's theme, and it is the only thing that makes a `className` passed by a caller
actually displace a variant class rather than land next to it and lose on specificity order.

## States are variants of the same class list

Figma draws hover, focus, pressed and disabled as separate frames because it has no other way
to show them. In code they are pseudo-class prefixes on the variant they belong to, as above:
`hover:`, `focus-visible:`, `active:`, `disabled:`.

Two details this repo has already been bitten by:

- **`focus-visible:` rather than `focus:`.** A mouse click on a button should not leave a
  ring behind.
- **`ring-offset-*` must be scoped to `focus-visible:`.** Unscoped it paints a permanent
  ring on any element that also has a `shadow-*`, clipping the shadow. There is a comment
  about this in the legacy `button.tsx` and a note in `docs/tailwind-v4-migration-notes.md`.

Read the disabled colours off the Figma disabled frame rather than dimming with opacity. The
design system has `bg-bg-disabled`, `text-text-disabled` and `border-border-disabled-subtle`
for this, and `opacity-50` produces a different result on every background.

## Icons

Icons come from `src/components/ui/icon`. Download new SVGs out of the design context into
`src/components/ui/icon/svgs` and run `npm run generate:icons` — the components are generated
by svgr and are not written by hand.

Size icons with the design's values and colour them through `currentColor` so the variant's
text colour carries them: an `fg-*` token in Figma becomes `text-fg-*` on the wrapper. The
`[&_svg]:shrink-0` in the base class list stops a flex icon collapsing when the label is
long.

## Radix and behaviour

Where the legacy component used a Radix primitive, the v2 component uses the same one. This
is a restyle, so keyboard handling, focus trapping, portalling and ARIA wiring should not be
rewritten — those are the parts that are hard to get right and were already got right. Check
what `src/components/ui/<same-component>.tsx` imports before starting.

New components that need overlay, menu or form behaviour should reach for the Radix package
already in `package.json` rather than a new dependency or a hand-rolled version.

## Checklist

Before calling a v2 component done:

- Every property in the Figma component set is a variant, named as Figma names it.
- Every value of every property is implemented, including the ones this screen does not use.
- Hover, focus-visible, active and disabled are covered for each variant.
- `defaultVariants` matches the Figma default.
- Colours are semantic tokens with the doubled prefix; text uses a named style plus a family.
- `VariantProps<typeof …Variants>` is in the exported props type, and the variants object is
  exported alongside the component so a call site can borrow the classes.
- `forwardRef`, `displayName`, and classes composed through `cn`.
- No `any`. `npm run check-types` and `npm run lint` are clean.
