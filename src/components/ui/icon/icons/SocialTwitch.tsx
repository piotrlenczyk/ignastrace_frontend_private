/* eslint-disable simple-import-sort/imports  */
/* eslint-disable import/newline-after-import  */
import { cn } from '@/libs/utils';
import { type IconProps, sizes } from '../iconDefinition';
export const IconSocialTwitch = ({
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
      d="M20.5722 11.1429L17.1436 14.5714H13.7151L10.7151 17.5714V14.5714H6.85791V1.71428H20.5722V11.1429Z"
      fill="white"
    />
    <path
      d="M6.00056 0L1.71484 4.28571V19.7143H6.8577V24L11.1434 19.7143H14.572L22.2863 12V0H6.00056ZM20.5722 11.1429L17.1436 14.5714H13.7151L10.7151 17.5714V14.5714H6.85791V1.71428H20.5722V11.1429Z"
      fill="#9146FF"
    />
    <path
      d="M18.0009 4.71428H16.2866V9.85714H18.0009V4.71428Z"
      fill="#9146FF"
    />
    <path
      d="M13.2866 4.71429H11.5723V9.85715H13.2866V4.71429Z"
      fill="#9146FF"
    />
  </svg>
);
