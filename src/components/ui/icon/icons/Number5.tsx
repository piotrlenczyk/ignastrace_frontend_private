/* eslint-disable simple-import-sort/imports  */
/* eslint-disable import/newline-after-import  */
import { cn } from '@/libs/utils';
import { type IconProps, sizes } from '../iconDefinition';
export const IconNumber5 = ({
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
    <path d="M14.75 21H6.5V19.5H14.75C15.44 19.5 16 18.94 16 18.25V13.75C16 13.06 15.44 12.5 14.75 12.5H9.25C7.735 12.5 6.5 11.265 6.5 9.75V3H17.5V4.5H8V9.75C8 10.44 8.56 11 9.25 11H14.75C16.265 11 17.5 12.235 17.5 13.75V18.25C17.5 19.765 16.265 21 14.75 21Z" />
  </svg>
);
