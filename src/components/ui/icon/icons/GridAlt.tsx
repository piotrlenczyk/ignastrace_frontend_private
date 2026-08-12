/* eslint-disable simple-import-sort/imports  */
/* eslint-disable import/newline-after-import  */
import { cn } from '@/libs/utils';
import { type IconProps, sizes } from '../iconDefinition';
export const IconGridAlt = ({
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
      d="M21 9H13V3H19.75C20.44 3 21 3.56 21 4.25V9ZM14.5 7.5H19.5V4.5H14.5V7.5Z"
      fill="#36394D"
      fillOpacity={0.45}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M13 21H19.75C20.44 21 21 20.44 21 19.75V11H13V21ZM19.5 19.5H14.5V12.5H19.5V19.5Z"
      fill="#36394D"
      fillOpacity={0.45}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4.25 21H11V15H3V19.75C3 20.44 3.56 21 4.25 21ZM9.5 19.5H4.5V16.5H9.5V19.5Z"
      fill="#36394D"
      fillOpacity={0.45}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3 13H11V3H4.25C3.56 3 3 3.56 3 4.25V13ZM9.5 11.5H4.5V4.5H9.5V11.5Z"
      fill="#36394D"
      fillOpacity={0.45}
    />
  </svg>
);
