import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconShieldAlert = ({
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
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.375 19.1151L12 22.3651V22.3701L17.625 19.1201C19.705 17.9201 21 15.6801 21 13.2751V5.1001C21 4.5351 20.62 4.0351 20.075 3.8901L12 1.7251L3.925 3.8851C3.38 4.0351 3 4.5301 3 5.0951V13.2701C3 15.6751 4.295 17.9151 6.375 19.1151ZM4.5 13.2701V5.2851L12 3.2751L19.5 5.2851V13.2701C19.5 15.1401 18.495 16.8801 16.875 17.8151L12 20.6301L7.125 17.8151C5.505 16.8801 4.5 15.1401 4.5 13.2701ZM12.75 12.5001V7.00009H11.25V12.5001H12.75ZM12 16.0001C12.5523 16.0001 13 15.5524 13 15.0001C13 14.4478 12.5523 14.0001 12 14.0001C11.4477 14.0001 11 14.4478 11 15.0001C11 15.5524 11.4477 16.0001 12 16.0001Z"
      fill="#00A661"
    />
  </svg>
);
