/* eslint-disable simple-import-sort/imports  */
/* eslint-disable import/newline-after-import  */
import { cn } from '@/libs/utils';
import { type IconProps, sizes } from '../iconDefinition';
export const IconWallet = ({
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
    <path
      d="M21 10.5251V9.75512C21 8.24012 19.765 7.00512 18.25 7.00512H4.255C3.84 7.00512 3.5 6.66512 3.5 6.25012C3.5 5.83512 3.84 5.49512 4.255 5.49512H20V3.99512H4.255C3.015 3.99512 2.005 5.00512 2 6.24512V17.2451C2 18.7601 3.235 19.9951 4.75 19.9951H18.25C19.765 19.9951 21 18.7601 21 17.2451V16.4701C21.57 16.3551 22 15.8501 22 15.2451V11.7451C22 11.1401 21.57 10.6351 21 10.5201V10.5251ZM20.5 15.0001H16.56L15.06 13.5001L16.56 12.0001H20.5V15.0001ZM18.25 18.5001H4.75C4.06 18.5001 3.5 17.9401 3.5 17.2501V8.36512C3.735 8.45012 3.99 8.50512 4.255 8.50512H18.25C18.94 8.50512 19.5 9.06512 19.5 9.75512V10.5001H15.94L13.825 12.6151C13.34 13.1001 13.34 13.8951 13.825 14.3851L15.94 16.5001H19.5V17.2501C19.5 17.9401 18.94 18.5001 18.25 18.5001Z"
      fill="#00A661"
    />
  </svg>
);
