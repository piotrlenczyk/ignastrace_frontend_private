/* eslint-disable simple-import-sort/imports  */
/* eslint-disable import/newline-after-import  */
import { cn } from '@/libs/utils';
import { type IconProps, sizes } from '../iconDefinition';
export const IconNotificationRingingLine = ({
  className,
  color = 'currentColor',
  size = 'fontSize',
  ...props
}: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={sizes[size]}
    height={sizes[size]}
    viewBox="0 0 49 48"
    fill={color}
    className={cn('inline-block shrink-0', className)}
    {...props}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11.07 3.56982L13.19 5.68982C10.16 8.70982 8.5 12.7298 8.5 16.9998H5.5C5.5 11.9298 7.48 7.15982 11.07 3.56982ZM37.9301 3.56982L35.8101 5.68982C38.8301 8.70982 40.5001 12.7298 40.5001 16.9998H43.5001C43.5001 11.9298 41.5201 7.14982 37.9301 3.56982ZM37.5 16.9999C37.5 9.82988 31.67 3.99988 24.5 3.99988C17.33 3.99988 11.5 9.82988 11.5 16.9999V24.8999L8.5 30.0999V37.9999H17.15C17.85 41.4199 20.88 43.9999 24.5 43.9999C28.12 43.9999 31.15 41.4199 31.85 37.9999H40.5V30.0999L37.5 24.8999V16.9999ZM24.5 40.9999C22.55 40.9999 20.9 39.7399 20.28 37.9999H28.73C28.11 39.7399 26.46 40.9999 24.51 40.9999H24.5ZM37.5 34.9999H11.5V30.8999L14.5 25.6999V16.9899C14.5 11.4799 18.99 6.98988 24.5 6.98988C30.01 6.98988 34.5 11.4799 34.5 16.9899V25.6999L37.5 30.8999V34.9999Z"
    />
  </svg>
);
