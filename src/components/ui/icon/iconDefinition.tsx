import type { SVGProps } from 'react';

export type IconProps = Omit<
  SVGProps<SVGSVGElement>,
  'color' | 'width' | 'height'
> & {
  size?: 'small' | 'medium' | 'mediumLarge' | 'large' | 'fontSize';
  color?: string;
};

export const sizes = {
  small: '12px',
  medium: '16px',
  mediumLarge: '20px',
  large: '24px',
  fontSize: '1em',
};
