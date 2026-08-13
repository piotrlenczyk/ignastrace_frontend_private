import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconSparksAltLine = ({ className, color = 'currentColor', size = 'fontSize', ...props }: IconProps) => (
  <svg
    width={sizes[size]}
    height={sizes[size]}
    viewBox="0 0 24 24"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    className={cn('inline-block shrink-0', className)}
    {...props}
  >
    <g id="sparks-alt">
      <path
        id="Vector"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.75 8H12.25C12.25 6.76 11.24 5.75 10 5.75V4.25C11.24 4.25 12.25 3.24 12.25 2H13.75C13.75 3.24 14.76 4.25 16 4.25V5.75C14.76 5.75 13.75 6.76 13.75 8ZM10 10.25C8.21 10.25 6.75 8.79 6.75 7H5.25C5.25 8.79 3.79 10.25 2 10.25V11.75C3.79 11.75 5.25 13.21 5.25 15H6.75C6.75 13.21 8.21 11.75 10 11.75V10.25ZM6 12.45C5.63 11.87 5.135 11.375 4.55 11C5.13 10.63 5.625 10.135 6 9.55C6.37 10.13 6.865 10.625 7.45 11C6.87 11.37 6.375 11.865 6 12.45ZM22 15.25C19.105 15.25 16.75 12.895 16.75 10H15.25C15.25 12.895 12.895 15.25 10 15.25V16.75C12.895 16.75 15.25 19.105 15.25 22H16.75C16.75 19.105 19.105 16.75 22 16.75V15.25ZM16 18.92C15.355 17.665 14.33 16.645 13.08 16C14.335 15.355 15.355 14.33 16 13.08C16.645 14.335 17.67 15.355 18.92 16C17.665 16.645 16.645 17.67 16 18.92Z"
      />
    </g>
  </svg>
);
