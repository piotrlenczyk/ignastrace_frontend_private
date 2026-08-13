import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconLocationPinCheck = ({ className, color = 'currentColor', size = 'fontSize', ...props }: IconProps) => (
  <svg
    width={sizes[size]}
    height={sizes[size]}
    viewBox="0 0 24 24"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    className={cn('inline-block shrink-0', className)}
    {...props}
  >
    <g id="location-pin-check">
      <path
        id="Vector"
        d="M12 2C7.59 2 4 5.59 4 10C4 11.865 4.66 13.685 5.855 15.12L11.04 21.345C11.28 21.63 11.63 21.795 12 21.795C12.37 21.795 12.72 21.63 12.96 21.345L18.145 15.12C19.34 13.685 20 11.87 20 10C20 5.59 16.41 2 12 2ZM11.635 12.925C11.39 13.17 11.07 13.29 10.75 13.29C10.43 13.29 10.11 13.17 9.865 12.925L8.22 11.28L9.28 10.22L10.75 11.69L15.22 7.22L16.28 8.28L11.635 12.925Z"
      />
    </g>
  </svg>
);
