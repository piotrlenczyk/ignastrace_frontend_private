/* eslint-disable simple-import-sort/imports  */
/* eslint-disable import/newline-after-import  */
import { cn } from '@/libs/utils';
import { type IconProps, sizes } from '../iconDefinition';
export const IconWarningLine = ({
  className,
  color = 'currentColor',
  size = 'fontSize',
  ...props
}: IconProps) => (
  <svg
    width={sizes[size]}
    height={sizes[size]}
    viewBox="0 0 24 25"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    className={cn('inline-block shrink-0', className)}
    {...props}
  >
    <path
      d="M11.9988 9.73657V13.7366M11.9988 17.7366H12.0088M10.2888 4.59653L1.8188 18.7365C1.64417 19.039 1.55177 19.3818 1.55079 19.7311C1.54981 20.0803 1.64029 20.4237 1.81323 20.7271C1.98616 21.0305 2.23553 21.2833 2.53651 21.4604C2.83749 21.6375 3.1796 21.7327 3.5288 21.7365H20.4688C20.818 21.7327 21.1601 21.6375 21.4611 21.4604C21.7621 21.2833 22.0114 21.0305 22.1844 20.7271C22.3573 20.4237 22.4478 20.0803 22.4468 19.7311C22.4458 19.3818 22.3534 19.039 22.1788 18.7365L13.7088 4.59653C13.5305 4.30264 13.2795 4.05965 12.98 3.89102C12.6805 3.72238 12.3425 3.63379 11.9988 3.63379C11.6551 3.63379 11.3171 3.72238 11.0176 3.89102C10.7181 4.05965 10.4671 4.30264 10.2888 4.59653Z"
      stroke="currentColor"
      strokeOpacity={0.8}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
