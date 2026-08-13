import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconGlobeAlt = ({ className, color = 'currentColor', size = 'fontSize', ...props }: IconProps) => (
  <svg
    width={sizes[size]}
    height={sizes[size]}
    viewBox="0 0 24 24"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    className={cn('inline-block shrink-0', className)}
    {...props}
  >
    <path d="M12 2C6.485 2 2 6.485 2 12C2 17.515 6.485 22 12 22C17.515 22 22 17.515 22 12C22 6.485 17.515 2 12 2ZM20.46 11.25H16.965C16.77 7.775 15.265 5.25 14.04 3.76C17.505 4.62 20.135 7.605 20.455 11.25H20.46ZM12 20.245C11.025 19.3 8.79 16.715 8.535 12.75H15.47C15.21 16.715 12.98 19.295 12.005 20.245H12ZM12 3.76C12.975 4.705 15.21 7.29 15.465 11.255H8.53C8.79 7.29 11.02 4.71 11.995 3.76H12ZM9.955 3.76C8.73 5.255 7.23 7.775 7.03 11.25H3.54C3.86 7.605 6.49 4.62 9.955 3.76ZM3.54 12.75H7.035C7.23 16.225 8.735 18.75 9.96 20.24C6.495 19.38 3.865 16.395 3.545 12.75H3.54ZM14.045 20.24C15.27 18.745 16.77 16.225 16.97 12.75H20.465C20.145 16.395 17.515 19.38 14.05 20.24H14.045Z" />
  </svg>
);
