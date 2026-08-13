import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconOpenEternalLink = ({
  className,
  color = 'currentColor',
  size = 'fontSize',
  ...props
}: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={sizes[size]}
    height={sizes[size]}
    viewBox="0 0 16 16"
    fill={color}
    className={cn('inline-block shrink-0', className)}
    {...props}
  >
    <path
      d="M8 3.66699H3.83301C3.37316 3.66717 3 4.04108 3 4.50098V12.167C3 12.6269 3.37316 13.0008 3.83301 13.001H11.5C11.96 13.001 12.333 12.627 12.333 12.167V8.00098H13.333V12.167C13.333 13.177 12.51 14.001 11.5 14.001H3.83301C2.82316 14.0008 2 13.1769 2 12.167V4.50098C2 3.49109 2.82316 2.66717 3.83301 2.66699H8V3.66699ZM13.833 1.33398C14.2929 1.33398 14.6668 1.70714 14.667 2.16699V6.00098H13.667V3.04102L7.51953 9.1875L6.81348 8.48047L12.96 2.33398H10V1.33398H13.833Z"
      fill="currentColor"
    />
  </svg>
);
