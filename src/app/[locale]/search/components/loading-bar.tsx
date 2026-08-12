import clsx from 'clsx';

import { IconCheck } from '@/components/ui/icon/icons/Check';

export const LoadingBar = (
  { loading, loadedText, last = false }:
  { loading: boolean; loadedText: string; last?: boolean }) => (

  <div className={clsx(loading && `
    relative h-2 w-32 overflow-hidden 
    rounded-full bg-[#00a661]/5
    pl-2 before:absolute before:-top-6
    before:size-12
    before:animate-loading-bar
    before:bg-[radial-gradient(#00A66163,#00A66100_65%)]
  `)}
  >
    {loading
      ? null
      : (
          <span
            className={clsx(
              'flex animate-fade-in items-center gap-1 text-right font-semibold',
              last ? 'text-primary' : 'text-secondary',
            )}
          >
            {loadedText}
            <IconCheck />
          </span>
        )}
  </div>
);
