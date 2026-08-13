import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconUserCircle = ({
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
    <g id="user-circle">
      <path
        id="Vector"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2 12C2 6.485 6.485 2 12 2C17.515 2 22 6.485 22 12C22 17.515 17.515 22 12 22C6.485 22 2 17.515 2 12ZM7.63 18.665L7.49 19.19H7.495C8.805 20.015 10.35 20.5 12.005 20.5C13.66 20.5 15.205 20.015 16.515 19.19L16.375 18.665C16.11 17.68 15.215 16.995 14.2 16.995H9.805C8.785 16.995 7.895 17.685 7.63 18.665ZM14.2 15.495C15.865 15.495 17.33 16.605 17.795 18.2V18.205C19.455 16.65 20.5 14.45 20.5 12C20.5 7.315 16.685 3.5 12 3.5C7.315 3.5 3.5 7.315 3.505 11.995C3.505 14.445 4.55 16.65 6.21 18.2C6.675 16.605 8.14 15.495 9.805 15.495H14.2ZM7.5 9.5C7.5 7.02 9.52 5 12 5C14.48 5 16.5 7.02 16.5 9.5C16.5 11.98 14.48 14 12 14C9.52 14 7.5 11.98 7.5 9.5ZM9 9.5C9 11.155 10.345 12.5 12 12.5C13.655 12.5 15 11.155 15 9.5C15 7.845 13.655 6.5 12 6.5C10.345 6.5 9 7.845 9 9.5Z"
      />
    </g>
  </svg>
);
