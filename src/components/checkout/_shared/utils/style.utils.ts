import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const fontSizes = [
  'text-display',
  'text-heading1',
  'text-heading2',
  'text-heading3',
  'text-heading4',
  'text-heading5',
  'text-body-large',
  'text-body-default',
  'text-body-small',
  'text-caption',
];

const textColors = [
  'text-inherit',
  'text-initial',
  'text-transparent',
  'text-strong',
  'text-white',
  'text-weak',
  'text-brand',
  'text-brand-secondary',
  'text-disabled',
  'text-error',
  'text-warning',
  'text-success',
  'text-information',
  'text-inverse-strong',
  'text-inverse-weak',
  'text-inverse-disabled',
  'text-icon-neutral',
  'text-icon-weak',
  'text-icon-brand',
  'text-icon-brand-secondary',
  'text-icon-disabled',
  'text-icon-error',
  'text-icon-warning',
  'text-icon-success',
  'text-icon-information',
  'text-icon-inverse',
  'text-icon-inverse-strong',
  'text-icon-inverse-disabled',
  'text-resume-red',
  'text-resume-yellow',
  'text-resume-green',
  'text-resume-teal',
  'text-resume-blue',
  'text-resume-purple',
  'text-resume-black',
];

const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': fontSizes,
      'text-color': textColors,
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs));
}
