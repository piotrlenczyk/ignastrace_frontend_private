/* eslint-disable simple-import-sort/imports  */
/* eslint-disable import/newline-after-import  */
import { cn } from '@/libs/utils';
import { type IconProps, sizes } from '../iconDefinition';
export const IconChatBubbleDotsLine = ({
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
    <g id="chat-bubble-dots">
      <path
        id="Vector"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.77 21.7C6.925 21.765 7.09 21.795 7.25 21.795V21.79C7.575 21.79 7.895 21.665 8.135 21.425L11.56 18H19.25C20.765 18 22 16.765 22 15.25V5.75C22 4.235 20.765 3 19.25 3H4.75C3.235 3 2 4.235 2 5.75V15.25C2 16.765 3.235 18 4.75 18H6V20.545C6 21.055 6.3 21.505 6.77 21.7ZM3.5 5.75C3.5 5.06 4.06 4.5 4.75 4.5H19.25C19.94 4.5 20.5 5.06 20.5 5.75V15.25C20.5 15.94 19.94 16.5 19.25 16.5H10.94L7.5 19.94V16.5H4.75C4.06 16.5 3.5 15.94 3.5 15.25V5.75ZM13.5 10.495C13.5 11.3234 12.8284 11.995 12 11.995C11.1716 11.995 10.5 11.3234 10.5 10.495C10.5 9.66657 11.1716 8.995 12 8.995C12.8284 8.995 13.5 9.66657 13.5 10.495ZM16.5 11.995C17.3284 11.995 18 11.3234 18 10.495C18 9.66657 17.3284 8.995 16.5 8.995C15.6716 8.995 15 9.66657 15 10.495C15 11.3234 15.6716 11.995 16.5 11.995ZM9 10.495C9 11.3234 8.32843 11.995 7.5 11.995C6.67157 11.995 6 11.3234 6 10.495C6 9.66657 6.67157 8.995 7.5 8.995C8.32843 8.995 9 9.66657 9 10.495Z"
      />
    </g>
  </svg>
);
