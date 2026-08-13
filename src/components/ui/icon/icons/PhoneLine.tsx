import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconPhoneLine = ({ className, color = 'currentColor', size = 'fontSize', ...props }: IconProps) => (
  <svg
    width={sizes[size]}
    height={sizes[size]}
    viewBox="0 0 24 24"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    className={cn('inline-block shrink-0', className)}
    {...props}
  >
    <g id="phone">
      <path
        id="Vector"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.25 22H15.75C17.265 22 18.5 20.765 18.5 19.25V4.75C18.5 3.235 17.265 2 15.75 2H8.25C6.735 2 5.5 3.235 5.5 4.75V19.25C5.5 20.765 6.735 22 8.25 22ZM7 4.75C7 4.06 7.56 3.5 8.25 3.5H15.75C16.44 3.5 17 4.06 17 4.75V19.25C17 19.94 16.44 20.5 15.75 20.5H8.25C7.56 20.5 7 19.94 7 19.25V4.75ZM10 5H14V6.5H10V5Z"
      />
    </g>
  </svg>
);
