import type { ReactNode } from 'react';

import { cn } from '@/libs/utils';

export const Card = ({ children, className, ...rest }: { children: ReactNode; className?: string }) => (
  <div
    className={cn(
      'rounded-2xl bg-base shadow-[0px_2px_4px_-2px_rgba(0,0,0,0.08),0px_4px_8px_-2px_rgba(0,0,0,0.04)]',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
);
