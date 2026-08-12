/* eslint-disable simple-import-sort/imports  */
/* eslint-disable import/newline-after-import  */
import { cn } from '@/libs/utils';
import { type IconProps, sizes } from '../iconDefinition';
export const IconInbox = ({
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
    <g id="inbox">
      <path
        id="Vector"
        d="M18.78 4H5.22L2 13.12V17.25C2 18.765 3.235 20 4.75 20H19.25C20.765 20 22 18.765 22 17.25V13.12L18.78 4ZM6.28 5.5H17.72L20.19 12.5H14.5L14.31 12.96C13.92 13.895 13.015 14.5 12 14.5C10.985 14.5 10.08 13.895 9.69 12.96L9.5 12.5H3.81L6.28 5.5ZM19.25 18.5H4.75C4.06 18.5 3.5 17.94 3.5 17.25V14H8.535C9.245 15.23 10.555 16 12 16C13.445 16 14.755 15.23 15.465 14H20.5V17.25C20.5 17.94 19.94 18.5 19.25 18.5Z"
      />
    </g>
  </svg>
);
