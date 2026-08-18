import { type SVGProps } from 'react';

import { type IconColor } from '@/components/checkout/_shared/types/color.types';
import { type IconsName } from '@/components/checkout/_shared/types/icons.types';
import { cn } from '@/components/checkout/_shared/utils/style.utils';

export type IconProps = SVGProps<SVGSVGElement> & {
  name: IconsName;
  color?: IconColor;
  applyColor?: boolean;
};

const colorToTextColorMap: Record<IconColor, `text-icon-${IconColor}`> = {
  strong: 'text-icon-strong',
  neutral: 'text-icon-neutral',
  weak: 'text-icon-weak',
  brand: 'text-icon-brand',
  'brand-secondary': 'text-icon-brand-secondary',
  disabled: 'text-icon-disabled',
  error: 'text-icon-error',
  warning: 'text-icon-warning',
  success: 'text-icon-success',
  information: 'text-icon-information',
  inverse: 'text-icon-inverse',
  'inverse-strong': 'text-icon-inverse-strong',
  'inverse-disabled': 'text-icon-inverse-disabled',
};

export const Icon = ({ name, color = 'neutral', applyColor = true, className, ...props }: IconProps) => {
  return (
    <svg {...props} className={cn('inline size-5 self-center', className, applyColor && colorToTextColorMap[color])}>
      <use href={`/icons/sprite.svg?v=19#${name}`} />
    </svg>
  );
};
