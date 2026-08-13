import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconFaceHappyLine = ({
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
    <g id="face-happy">
      <path
        id="Vector"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2 12C2 17.515 6.485 22 12 22C17.515 22 22 17.515 22 12C22 6.485 17.515 2 12 2C6.485 2 2 6.485 2 12ZM3.5 12C3.5 7.315 7.315 3.5 12 3.5C16.685 3.5 20.5 7.315 20.5 12C20.5 16.685 16.685 20.5 12 20.5C7.315 20.5 3.5 16.685 3.5 12ZM17 9.5C17 10.3284 16.3284 11 15.5 11C14.6716 11 14 10.3284 14 9.5C14 8.67157 14.6716 8 15.5 8C16.3284 8 17 8.67157 17 9.5ZM8.5 11C9.32843 11 10 10.3284 10 9.5C10 8.67157 9.32843 8 8.5 8C7.67157 8 7 8.67157 7 9.5C7 10.3284 7.67157 11 8.5 11ZM8.01508 13.805C8.17508 15.88 9.92508 17.5 12.0001 17.5H12.0051C14.0801 17.5 15.8301 15.875 15.9901 13.805L16.0501 13H7.95508L8.01508 13.805ZM12.0001 16C10.9851 16 10.1001 15.385 9.71008 14.5H9.71508H14.2901C13.9001 15.385 13.0151 16 12.0001 16Z"
      />
    </g>
  </svg>
);
