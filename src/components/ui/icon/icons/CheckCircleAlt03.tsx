import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconCheckCircleAlt03 = ({ className, color = 'currentColor', size = 'fontSize', ...props }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={sizes[size]}
    height={sizes[size]}
    viewBox="0 0 24 24"
    fill={color}
    className={cn('inline-block shrink-0', className)}
    {...props}
  >
    <path d="M12 3.5C7.30558 3.5 3.5 7.30558 3.5 12C3.5 16.6944 7.30558 20.5 12 20.5C16.6944 20.5 20.5 16.6944 20.5 12C20.5 10.6717 20.1953 9.41447 19.652 8.29454L20.727 7.11371C21.5377 8.55859 22 10.2253 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C14.6523 2 17.0634 3.03254 18.8532 4.71758L20.1957 3.24475L21.3043 4.25523L11.4375 15.0798C10.9296 15.6371 10.0476 15.6212 9.56009 15.0459L7.17786 12.2349L8.3222 11.2651L10.5205 13.8591L17.8426 5.82632C16.3194 4.38435 14.263 3.5 12 3.5Z" />
  </svg>
);
