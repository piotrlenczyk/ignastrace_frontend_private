/* eslint-disable simple-import-sort/imports  */
/* eslint-disable import/newline-after-import  */
import { cn } from '@/libs/utils';
import { type IconProps, sizes } from '../iconDefinition';
export const IconLocationPinCancelLine = ({
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
    <g id="location-pin-cancel">
      <path
        id="Vector"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4 10C4 5.59 7.59 2 12 2C16.41 2 20 5.59 20 10C20 11.87 19.34 13.685 18.145 15.12L12.96 21.345C12.72 21.63 12.37 21.795 12 21.795C11.63 21.795 11.28 21.63 11.04 21.345L5.855 15.12C4.66 13.685 4 11.865 4 10ZM12 20.155L16.995 14.16C17.965 12.995 18.5 11.515 18.5 10C18.5 6.415 15.585 3.5 12 3.5C8.415 3.5 5.5 6.415 5.5 10C5.5 11.52 6.035 12.995 7.005 14.16L12 20.155ZM12.0002 8.93997L14.4702 6.46997L15.5302 7.52997L13.0602 9.99997L15.5302 12.47L14.4702 13.53L12.0002 11.06L9.53021 13.53L8.47021 12.47L10.9402 9.99997L8.47021 7.52997L9.53021 6.46997L12.0002 8.93997Z"
      />
    </g>
  </svg>
);
