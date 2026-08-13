import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconChevronRightSmall = ({
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
    <g id="chevron-right-small">
      <path
        id="Vector"
        d="M9.77973 18.78L8.71973 17.72L14.4397 12L8.71973 6.27997L9.77973 5.21997L15.6747 11.115C16.1597 11.6 16.1597 12.395 15.6747 12.885L9.77973 18.78Z"
      />
    </g>
  </svg>
);
