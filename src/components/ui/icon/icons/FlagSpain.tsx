/* eslint-disable simple-import-sort/imports  */
/* eslint-disable import/newline-after-import  */
import { cn } from '@/libs/utils';
import { type IconProps, sizes } from '../iconDefinition';
export const IconFlagSpain = ({
  className,
  color = 'currentColor',
  size = 'fontSize',
  ...props
}: IconProps) => (
  <svg
    width={sizes[size]}
    height={sizes[size]}
    viewBox="0 0 48 48"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    className={cn('inline-block shrink-0', className)}
    {...props}
  >
    <g clipPath="url(#clip0_4003_169351)">
      <path
        d="M0 24C0 26.9357 0.528094 29.7478 1.49278 32.3478L24 34.4347L46.5072 32.3478C47.4719 29.7478 48 26.9357 48 24C48 21.0643 47.4719 18.2522 46.5072 15.6522L24 13.5652L1.49278 15.6522C0.528094 18.2522 0 21.0643 0 24H0Z"
        fill="#FFDA44"
      />
      <path
        d="M46.5072 15.6522C43.1162 6.51309 34.3192 0 24 0C13.6809 0 4.88383 6.51309 1.4928 15.6522H46.5072Z"
        fill="#D80027"
      />
      <path
        d="M1.4928 32.3478C4.88383 41.4869 13.6809 48 24 48C34.3192 48 43.1162 41.4869 46.5072 32.3478H1.4928Z"
        fill="#D80027"
      />
    </g>
    <defs>
      <clipPath id="clip0_4003_169351">
        <rect width={48} height={48} fill="white" />
      </clipPath>
    </defs>
  </svg>
);
