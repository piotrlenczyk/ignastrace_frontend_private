/* eslint-disable simple-import-sort/imports  */
/* eslint-disable import/newline-after-import  */
import { cn } from '@/libs/utils';
import { type IconProps, sizes } from '../iconDefinition';
export const IconComponentCard = ({
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
      d="M17.25 2H6.75C5.235 2 4 3.235 4 4.75V19.25C4 20.765 5.235 22 6.75 22H17.25C18.765 22 20 20.765 20 19.25V4.75C20 3.235 18.765 2 17.25 2ZM18.5 19.25C18.5 19.94 17.94 20.5 17.25 20.5H6.75C6.06 20.5 5.5 19.94 5.5 19.25V12H18.5V19.25ZM18.5 10.5H5.5V4.75C5.5 4.06 6.06 3.5 6.75 3.5H17.25C17.94 3.5 18.5 4.06 18.5 4.75V10.5ZM16.5 14H7.5V15.5H16.5V14ZM7.5 17H13.5V18.5H7.5V17Z"
    />
  </svg>
);
