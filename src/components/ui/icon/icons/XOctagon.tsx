/* eslint-disable simple-import-sort/imports  */
/* eslint-disable import/newline-after-import  */
import { cn } from '@/libs/utils';
import { type IconProps, sizes } from '../iconDefinition';
export const IconXOctagon = ({
  className,
  color = 'currentColor',
  size = 'fontSize',
  ...props
}: IconProps) => (
  <svg
    height={sizes[size]}
    viewBox="0 0 16 16"
    width={sizes[size]}
    xmlns="http://www.w3.org/2000/svg"
    fill={color}
    className={cn('inline-block shrink-0', className)}
    {...props}
  >
    <g
      style={{
        stroke: 'currentColor',
        strokeWidth: 1.5,
        fill: 'none',
        fillRule: 'evenodd',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        strokeOpacity: 0.8,
      }}
      transform="translate(1 1)"
    >
      <path d="m9 4.99943-3.99996 4zm-3.99996 0 3.99996 4z" />
      <path d="m4.24004.33276h5.51996l3.9067 3.90667v5.51997l-3.9067 3.9067h-5.51996l-3.90667-3.9067v-5.51997z" />
    </g>
  </svg>
);
