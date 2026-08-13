import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconTrashLineAlt = ({
  className,
  color = 'currentColor',
  size = 'fontSize',
  ...props
}: IconProps) => (
  <svg
    width={sizes[size]}
    height={sizes[size]}
    viewBox="0 0 20 20"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    className={cn('inline-block shrink-0', className)}
    {...props}
  >
    <g id="Icon left">
      <path
        id="Vector"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17.5 4.16663H13.3333V3.95829C13.3333 2.69579 12.3042 1.66663 11.0417 1.66663H8.95833C7.69583 1.66663 6.66667 2.69579 6.66667 3.95829V4.16663H2.5V5.41663H3.33333V16.0416C3.33333 17.3041 4.3625 18.3333 5.625 18.3333H14.375C15.6375 18.3333 16.6667 17.3041 16.6667 16.0416V5.41663H17.5V4.16663ZM7.91667 3.95829C7.91667 3.38329 8.38333 2.91663 8.95833 2.91663H11.0417C11.6167 2.91663 12.0833 3.38329 12.0833 3.95829V4.16663H7.91667V3.95829ZM15.4167 16.0416C15.4167 16.6166 14.95 17.0833 14.375 17.0833H5.625C5.05 17.0833 4.58333 16.6166 4.58333 16.0416V5.41663H15.4167V16.0416ZM8.75 7.91663H7.5V14.5833H8.75V7.91663ZM11.25 7.91663H12.5V14.5833H11.25V7.91663Z"
      />
    </g>
  </svg>
);
