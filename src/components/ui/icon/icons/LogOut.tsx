/* eslint-disable simple-import-sort/imports  */
/* eslint-disable import/newline-after-import  */
import { cn } from '@/libs/utils';
import { type IconProps, sizes } from '../iconDefinition';
export const IconLogOut = ({
  className,
  color = 'currentColor',
  size = 'fontSize',
  ...props
}: IconProps) => (
  <svg
    width={sizes[size]}
    height={sizes[size]}
    viewBox="0 0 16 16"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    className={cn('inline-block shrink-0', className)}
    {...props}
  >
    <g id="Icon left">
      <path
        id="Vector"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.90996 13.4234C4.06996 13.58 4.27663 13.6667 4.49996 13.6667H9.33329V14.67H4.49996C4.00996 14.67 3.54996 14.48 3.20329 14.1334C2.85663 13.7867 2.66663 13.3267 2.66663 12.8367V3.17004C2.66663 2.15671 3.48996 1.33337 4.49996 1.33337H9.33329V2.33671H4.49996C4.03996 2.33671 3.66663 2.71004 3.66663 3.17004V12.8334C3.66663 13.0567 3.75329 13.2667 3.90996 13.4234ZM11.02 4.81002L13.7833 7.57335C14.1066 7.90002 14.1066 8.43002 13.7833 8.75335L11.02 11.5167L10.3133 10.81L12.4566 8.66668H6.66663V7.66668H12.4633L10.3133 5.51668L11.02 4.81002Z"
      />
    </g>
  </svg>
);
