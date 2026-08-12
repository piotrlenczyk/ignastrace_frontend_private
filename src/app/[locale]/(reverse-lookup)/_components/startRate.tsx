import { IconStart } from '@/components/ui/icon/icons';

import type { StartRateProps } from '../_types/start-rate.types';

export const StartRate = ({ className = '', rating, maxStars = 5 }: StartRateProps) => {
  const fullStars = Math.floor(rating);
  const decimal = rating % 1;
  const hasPartialStar = decimal > 0;
  const emptyStars = maxStars - fullStars - (hasPartialStar ? 1 : 0);
  const partialPercentage = Math.round(decimal * 100);

  return (
    <div className="flex flex-row items-start gap-1">
      {Array(fullStars).fill(null).map((_, index) => (
        <div key={`full-${index}`} className="relative inline-block align-top">
          <IconStart className={`text-yellow-1000 ${className}`} />
        </div>
      ))}

      {hasPartialStar && (
        <div key="partial" className="relative align-top">
          <IconStart className={`text-[#ECEDEF] ${className}`} />
          <div
            className="absolute left-0 top-0 overflow-hidden"
            style={{ width: `${partialPercentage}%` }}
          >
            <IconStart className={`text-yellow-1000 ${className}`} />
          </div>
        </div>
      )}

      {Array(emptyStars).fill(null).map((_, index) => (
        <div key={`empty-${index}`} className="relative inline-block align-top">
          <IconStart className={`text-[#ECEDEF] ${className}`} />
        </div>
      ))}
    </div>
  );
};
