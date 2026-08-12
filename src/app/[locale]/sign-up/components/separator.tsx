import type { ReactNode } from 'react';

import { cn } from '@/libs/utils';

export const Separator = ({ children }: { children: ReactNode }) => {
  return (
    <div
      className={cn(
        'flex w-full items-center text-center',
        'before:-left-0 before:h-px before:w-full before:bg-gray-100',
        'after:-right-0 after:h-px after:w-full after:bg-gray-100',
      )}
    >
      <span className="px-4 text-sm uppercase">{children}</span>
    </div>
  );
};
