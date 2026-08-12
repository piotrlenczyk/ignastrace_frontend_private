/* eslint-disable simple-import-sort/imports  */
/* eslint-disable import/newline-after-import  */
import { cn } from '@/libs/utils';
import { type IconProps, sizes } from '../iconDefinition';
export const IconShieldCheck = ({
  className,
  color = 'currentColor',
  size = 'fontSize',
  ...props
}: IconProps) => (
  <svg
    width={sizes[size]}
    height={sizes[size]}
    viewBox="0 0 25 24"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    className={cn('inline-block shrink-0', className)}
    {...props}
  >
    <g id="shield-check">
      <path
        id="Vector"
        d="M20.325 3.8851L12.25 1.7251L4.175 3.8851C3.63 4.0301 3.25 4.5301 3.25 5.0951V13.2751C3.25 15.6801 4.545 17.9201 6.625 19.1201L12.25 22.3701L17.875 19.1201C19.955 17.9201 21.25 15.6801 21.25 13.2751V5.0951C21.25 4.5301 20.87 4.0351 20.325 3.8851ZM11.885 13.9251C11.64 14.1701 11.32 14.2901 11 14.2901C10.68 14.2901 10.36 14.1701 10.115 13.9251L7.97 11.7801L9.03 10.7201L11 12.6901L15.97 7.7201L17.03 8.7801L11.885 13.9251Z"
      />
    </g>
  </svg>
);
