/* eslint-disable simple-import-sort/imports  */
/* eslint-disable import/newline-after-import  */
import { cn } from '@/libs/utils';
import { type IconProps, sizes } from '../iconDefinition';
export const IconGoogleBrand = ({
  className,
  color = 'currentColor',
  size = 'fontSize',
  ...props
}: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={sizes[size]}
    height={sizes[size]}
    fill={color}
    className={cn('inline-block shrink-0', className)}
    {...props}
  >
    <path
      fill="#4285F4"
      d="M10.5 8.182v3.873h5.382a4.61 4.61 0 0 1-2.01 3.009l3.246 2.518c1.891-1.746 2.982-4.31 2.982-7.355 0-.709-.064-1.39-.182-2.045H10.5z"
    />
    <path
      fill="#34A853"
      d="M4.896 11.903l-.732.56-2.591 2.019C3.218 17.745 6.59 20 10.5 20c2.7 0 4.963-.89 6.618-2.418l-3.245-2.518c-.891.6-2.028.963-3.373.963-2.6 0-4.81-1.754-5.6-4.118l-.004-.006z"
    />
    <path
      fill="#FBBC05"
      d="M1.573 5.518A9.877 9.877 0 0 0 .5 10c0 1.618.39 3.136 1.073 4.482C1.573 14.49 4.9 11.9 4.9 11.9a5.99 5.99 0 0 1-.318-1.9c0-.664.118-1.3.318-1.9L1.573 5.518z"
    />
    <path
      fill="#EA4335"
      d="M10.5 3.982c1.473 0 2.782.509 3.827 1.49l2.864-2.863C15.454.991 13.2 0 10.5 0 6.59 0 3.218 2.245 1.573 5.518L4.9 8.1c.79-2.364 3-4.118 5.6-4.118z"
    />
  </svg>
);
