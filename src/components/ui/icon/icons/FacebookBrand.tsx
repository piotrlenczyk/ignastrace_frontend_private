import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconFacebookBrand = ({
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
      fill="#0866FF"
      d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.69 3.229 8.625 7.584 9.706v-6.65H5.522V10h2.062V8.683c0-3.403 1.54-4.981 4.882-4.981.634 0 1.727.124 2.174.248v2.77a12.853 12.853 0 0 0-1.155-.037c-1.64 0-2.273.621-2.273 2.236V10h3.266l-.56 3.056h-2.706v6.87C16.164 19.33 20 15.114 20 10Z"
    />
    <path
      fill="#fff"
      d="M13.917 13.056 14.478 10h-3.266V8.92c0-1.616.634-2.237 2.273-2.237.51 0 .92.013 1.155.037V3.95c-.447-.124-1.54-.248-2.174-.248-3.341 0-4.882 1.578-4.882 4.981V10H5.522v3.056h2.062v6.65a10.015 10.015 0 0 0 3.628.22v-6.87h2.705Z"
    />
  </svg>
);
