import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/*
 * tailwind-merge knows Tailwind's own utilities, not this project's. Anything
 * declared in @theme or defined with @utility is invisible to it, so a pair of
 * such classes is not recognised as conflicting and both survive the merge —
 * which is the one thing `cn` exists to prevent.
 *
 * Only the registrations below actually change behaviour. The semantic colour
 * tokens are deliberately *not* enumerated: tailwind-merge already accepts any
 * unknown `text-*` / `bg-*` / `border-*` name as a theme colour, so `bg-primary`
 * against `bg-secondary`, or the hand-written `bg-base` / `bg-weak` /
 * `text-weak` / `text-success`, resolve correctly without being listed. Listing
 * them would be configuration no test could distinguish from its own absence.
 * See docs/adr/0003-tailwind-class-linting-and-token-aware-merging.md.
 */
const twMerge = extendTailwindMerge<'animation-duration' | 'columns-count'>({
  extend: {
    theme: {
      /*
       * Custom font sizes. Without registration a name falls through to the
       * catch-all colour matcher, so it neither displaces a real font size nor
       * survives alongside a colour — it silently swallows one instead.
       *
       * `caption` is the legacy scale's one custom step. The rest are the new
       * design's named text styles from styles/new/typo.css, and leaving them
       * out was a live bug rather than untidiness: `text-md-semibold` was
       * being treated as a colour, which put it in the same class group as
       * `text-text-primary-on-brand` on the v2 primary button. cva emits the
       * size variant after the hierarchy variant, so the text style won and the
       * colour was dropped — the Lookup button rendered its label in the
       * inherited body colour on a blue fill. Every v2 component that sets a
       * text style and a text colour through `cn` had the same defect.
       *
       * These are enumerated, unlike the semantic colours, precisely because
       * tailwind-merge's fallback for an unknown `text-*` is "colour": a colour
       * needs no registration to behave, a font size does.
       */
      text: [
        'caption',
        'display-xl-medium',
        'display-lg-medium',
        'display-md-medium',
        'display-sm-medium',
        'display-xs-medium',
        'display-xs-semibold',
        'xl-regular',
        'xl-medium',
        'xl-semibold',
        'xl-bold',
        'lg-regular',
        'lg-medium',
        'lg-semibold',
        'lg-bold',
        'md-regular',
        'md-medium',
        'md-semibold',
        'md-bold',
        'sm-regular',
        'sm-medium',
        'sm-semibold',
        'sm-bold',
        'xs-regular',
        'xs-medium',
        'xs-semibold',
        'xs-bold',
      ],
      /*
       * Hand-written box-shadow utilities. `icon`/`raised`/`raised-lg` are the
       * legacy elevations; `uui-*` are the new design's, which have to displace
       * both each other and Tailwind's stock `shadow-md` when a call site
       * overrides one.
       */
      shadow: ['icon', 'raised', 'raised-lg', 'uui-xs', 'uui-md', 'uui-xl', 'uui-overlay', 'uui-xs-skeuomorphic'],
    },
    classGroups: {
      /*
       * Hand-written utilities with no Tailwind namespace to hang off.
       * `columns-count-*` sets the same property as the stock `columns-*`, so
       * the two have to displace each other; `animation-duration-*` sets
       * animation-duration, which is not what the stock `duration-*` targets.
       */
      'animation-duration': ['animation-duration-500', 'animation-duration-1000'],
      'columns-count': ['columns-count-1', 'columns-count-2', 'columns-count-3', 'columns-count-4'],
    },
    conflictingClassGroups: {
      columns: ['columns-count'],
      'columns-count': ['columns'],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const titleize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
