import { IconInfoCircleLine } from '@/components/ui/icon/icons';
import { cn } from '@/libs/utils';

type AlertInfoProps = {
  children: React.ReactNode;
  className?: string;
  iconClassName?: string;
};

export const AlertInfo = ({ children, className = '', iconClassName = '' }: AlertInfoProps) => {
  return (
    <div
      className={cn(
        'rounded-lg border-y border-r border-l-4',
        'border-[#EAEAEE] border-l-gray-500 bg-[#FCFCFD] p-4 lg:p-3',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <IconInfoCircleLine className={cn('size-[22px] text-gray-500 lg:size-6', iconClassName)} />
        <p className="text-sm text-weak lg:text-base">{children}</p>
      </div>
    </div>
  );
};
