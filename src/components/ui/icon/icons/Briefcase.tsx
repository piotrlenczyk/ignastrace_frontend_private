/* eslint-disable simple-import-sort/imports  */
/* eslint-disable import/newline-after-import  */
import { cn } from '@/libs/utils';
import { type IconProps, sizes } from '../iconDefinition';
export const IconBriefcase = ({
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
    <path d="M19.25 6.5H16V5.75C16 4.235 14.765 3 13.25 3H10.75C9.235 3 8 4.235 8 5.75V6.5H4.75C3.235 6.5 2 7.735 2 9.25V18.25C2 19.765 3.235 21 4.75 21H19.25C20.765 21 22 19.765 22 18.25V9.25C22 7.735 20.765 6.5 19.25 6.5ZM9.5 5.75C9.5 5.06 10.06 4.5 10.75 4.5H13.25C13.94 4.5 14.5 5.06 14.5 5.75V6.5H9.5V5.75ZM4.75 8H19.25C19.94 8 20.5 8.56 20.5 9.25V9.94L17.94 12.5H6.06L3.5 9.94V9.25C3.5 8.56 4.06 8 4.75 8ZM19.25 19.5H4.75C4.06 19.5 3.5 18.94 3.5 18.25V12.06L5.44 14H7V15.5H8.5V14H15.5V15.5H17V14H18.56L20.5 12.06V18.25C20.5 18.94 19.94 19.5 19.25 19.5Z" />
  </svg>
);
