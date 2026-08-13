import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconFlagUkraine = ({
  className,
  color = 'currentColor',
  size = 'fontSize',
  ...props
}: IconProps) => (
  <svg
    width={sizes[size]}
    height={sizes[size]}
    viewBox="0 0 40 40"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    className={cn('inline-block shrink-0', className)}
    {...props}
  >
    <g clipPath="url(#clip0_11216_3958)">
      <path
        d="M20 40C31.0457 40 40 31.0457 40 20C40 8.9543 31.0457 0 20 0C8.9543 0 0 8.9543 0 20C0 31.0457 8.9543 40 20 40Z"
        fill="#FFDA44"
      />
      <path
        d="M0 20C0 8.95437 8.95437 0 20 0C31.0456 0 40 8.95437 40 20"
        fill="#338AF3"
      />
    </g>
    <defs>
      <clipPath id="clip0_11216_3958">
        <rect width={40} height={40} fill="white" />
      </clipPath>
    </defs>
  </svg>
);
