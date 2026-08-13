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
       * The one custom font size. Without it `text-caption` falls through to
       * the catch-all colour matcher, so it neither displaces `text-sm` nor
       * survives alongside a colour — it silently swallows one instead.
       */
      text: ['caption'],
      /* Hand-written box-shadow utilities. */
      shadow: ['icon', 'raised', 'raised-lg'],
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
