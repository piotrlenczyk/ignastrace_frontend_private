import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconArrowLeft = ({
  className,
  color = 'currentColor',
  size = 'fontSize',
  ...props
}: IconProps) => (
  <svg
    width={sizes[size]}
    height={sizes[size]}
    viewBox="0 0 24 24"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    className={cn('inline-block shrink-0', className)}
    {...props}
  >
    <g id="arrow-left">
      <path
        id="Vector"
        d="M21.0001 11.25H5.31005L10.5301 6.02997L9.47005 4.96997L3.32505 11.115C2.84005 11.6 2.84005 12.395 3.32505 12.885L9.47005 19.03L10.5301 17.97L5.31005 12.75H21.0001V11.25Z"
      />
    </g>
  </svg>
);
