'use client';

import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/libs/utils';

/*
 * `inline-block`, not the browser default `inline`, because of a Tailwind v4
 * change: v3's `space-y-*` put the gap on the *later* sibling as `margin-top`,
 * v4 puts it on the *earlier* one as `margin-block-end`. Every `FormItem` is a
 * `space-y-2` wrapper whose earlier sibling is this label, and vertical margins
 * do nothing on an inline box — so the gap silently collapsed to zero.
 * `inline-block` restores it while keeping the label's shrink-to-fit width, so
 * the click target is unchanged too. See docs/tailwind-v4-migration-notes.md.
 */
const labelVariants = cva('inline-block peer-disabled:cursor-not-allowed peer-disabled:opacity-70');

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
