import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconClipboardList = ({ className, color = 'currentColor', size = 'fontSize', ...props }: IconProps) => (
  <svg
    width={sizes[size]}
    height={sizes[size]}
    viewBox="0 0 20 20"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    className={cn('inline-block shrink-0', className)}
    {...props}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M14.1668 2.91602V1.66602H5.8335V2.91602H3.3335V18.3327H16.6668V2.91602H14.1668ZM7.0835 2.91602H12.9168V3.54102C12.9168 4.11602 12.4502 4.58268 11.8752 4.58268H8.12516C7.55016 4.58268 7.0835 4.11602 7.0835 3.54102V2.91602ZM15.4168 17.0827H4.5835V4.16602H5.921C6.196 5.12435 7.07516 5.83268 8.12516 5.83268H11.8752C12.921 5.83268 13.8043 5.12435 14.0793 4.16602H15.4168V17.0827ZM13.7502 10.8327H9.16683V12.0827H13.7502V10.8327ZM6.25016 12.0827V10.8327H7.91683V12.0827H6.25016ZM13.7502 13.7493H9.16683V14.9993H13.7502V13.7493ZM6.25016 14.9993V13.7493H7.91683V14.9993H6.25016ZM13.7502 7.91602H9.16683V9.16602H13.7502V7.91602ZM6.25016 9.16602V7.91602H7.91683V9.16602H6.25016Z"
      fill="#36394D"
      fillOpacity={0.45}
    />
  </svg>
);
