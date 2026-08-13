import { cn } from '@/libs/utils';

export const NumericBadge = ({ amount = 0, className }: { amount?: number; className?: string }) =>
  amount > 0 && (
    <div className={cn('size-6 rounded-full bg-red-1000 px-1 text-xs leading-[24px] text-white', className)}>
      {amount > 9 ? '9+' : amount}
    </div>
  );
