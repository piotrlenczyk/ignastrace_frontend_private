/* eslint-disable simple-import-sort/imports  */
/* eslint-disable import/newline-after-import  */
import { cn } from '@/libs/utils';
import { type IconProps, sizes } from '../iconDefinition';
export const IconTimeRefresh = ({
  className,
  color = 'currentColor',
  size = 'fontSize',
  ...props
}: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={sizes[size]}
    height={sizes[size]}
    viewBox="0 0 24 24"
    fill={color}
    className={cn('inline-block shrink-0', className)}
    {...props}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2.00012C9.58 2.00012 7.295 2.86012 5.5 4.40012V2.00012H4V5.75012C4 6.44012 4.56 7.00012 5.25 7.00012H9V5.50012H6.535C8.055 4.22012 9.97 3.50012 12 3.50012C16.685 3.50012 20.5 7.31512 20.5 12.0001C20.5 12.9451 20.345 13.8751 20.04 14.7601L21.46 15.2451C21.82 14.2001 22 13.1101 22 11.9951C22 6.48012 17.515 1.99512 12 1.99512V2.00012ZM11.25 6.49512V12.3101L14.72 15.7801L15.78 14.7201L12.75 11.6901V6.49512H11.25ZM15 17.0001H18.75V17.0051C19.44 17.0051 20 17.5651 20 18.2551V22.0051H18.5V19.6051C16.705 21.1451 14.42 22.0051 12 22.0051C6.485 22.0051 2 17.5201 2 12.0051C2 10.8901 2.18 9.80013 2.54 8.75513L3.96 9.24013C3.655 10.1251 3.5 11.0551 3.5 12.0001C3.5 16.6851 7.315 20.5001 12 20.5001C14.03 20.5001 15.945 19.7801 17.465 18.5001H15V17.0001Z"
    />
  </svg>
);
