import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconArrowRight = ({ className, color = 'currentColor', size = 'fontSize', ...props }: IconProps) => (
  <svg
    width={sizes[size]}
    height={sizes[size]}
    viewBox="0 0 24 24"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    className={cn('inline-block shrink-0', className)}
    {...props}
  >
    <path
      d="M20.675 11.1147L14.53 4.96973L13.47 6.02973L18.69 11.2497H3V12.7497H18.69L13.47 17.9697L14.53 19.0297L20.675 12.8847C21.16 12.3997 21.16 11.6047 20.675 11.1147Z"
      fill="white"
    />
  </svg>
);
