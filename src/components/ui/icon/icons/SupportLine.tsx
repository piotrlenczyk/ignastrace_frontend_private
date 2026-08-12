/* eslint-disable simple-import-sort/imports  */
/* eslint-disable import/newline-after-import  */
import { cn } from '@/libs/utils';
import { type IconProps, sizes } from '../iconDefinition';
export const IconSupportLine = ({
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
    <g id="support">
      <path
        id="Vector"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.03827 10H5.75C7.26878 10 8.5 11.2312 8.5 12.75V14.25C8.5 15.6845 7.40162 16.8625 6 16.9888V17.75C6 18.4404 6.55964 19 7.25 19H9.62803C9.93691 18.1261 10.7703 17.5 11.75 17.5H12.25C13.4926 17.5 14.5 18.5074 14.5 19.75C14.5 20.9926 13.4926 22 12.25 22H11.75C10.7703 22 9.93691 21.3739 9.62803 20.5H7.25C5.73122 20.5 4.5 19.2688 4.5 17.75V17H3.5V10.75C3.5 5.91579 7.41579 2 12.25 2C17.0842 2 21 5.91579 21 10.75V17H18.75C17.2312 17 16 15.7688 16 14.25V12.75C16 11.2312 17.2312 10 18.75 10H19.4617C19.0867 6.34697 16.0025 3.5 12.25 3.5C8.49747 3.5 5.41325 6.34697 5.03827 10ZM5.75 11.5H5V15.5H5.75C6.44036 15.5 7 14.9404 7 14.25V12.75C7 12.0596 6.44036 11.5 5.75 11.5ZM18.75 11.5C18.0596 11.5 17.5 12.0596 17.5 12.75V14.25C17.5 14.9404 18.0596 15.5 18.75 15.5H19.5V11.5H18.75ZM11 19.75C11 19.3358 11.3358 19 11.75 19H12.25C12.6642 19 13 19.3358 13 19.75C13 20.1642 12.6642 20.5 12.25 20.5H11.75C11.3358 20.5 11 20.1642 11 19.75Z"
      />
    </g>
  </svg>
);
