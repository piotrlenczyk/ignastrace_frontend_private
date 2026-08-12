import { useTranslations } from 'next-intl';
import React from 'react';

import { IconCnn, IconForbes, IconFox, IconUsaToday } from '@/components/ui/icon/icons';
import { cn } from '@/libs/utils';

type AsSeenOnProps = {
  className?: string;
};

const AS_SEEN_ON_ITEMS = [
  { id: 1, icon: <IconFox className="h-[20px] w-[50px] sm:h-[25px] sm:w-[60px] md:h-[30px] md:w-[70px]" /> },
  { id: 2, icon: <IconUsaToday className="h-[32px] w-[80px] sm:h-[40px] sm:w-[100px] md:h-[48px] md:w-[117px]" /> },
  { id: 3, icon: <IconForbes className="h-[20px] w-[75px] sm:h-[25px] sm:w-[90px] md:h-[30px] md:w-[111px]" /> },
  { id: 4, icon: <IconCnn className="h-[22px] w-[50px] sm:h-[28px] sm:w-[60px] md:h-[33px] md:w-[71px]" /> },
];

const AsSeenOn: React.FC<AsSeenOnProps> = ({ className }) => {
  const t = useTranslations('pages.reverse_lookup.components.as_seen_on');
  return (
    <div className={cn(className)}>
      <div className="relative">
        <p
          className={`
            flex w-full
            items-center
            justify-center
            before:absolute
            before:top-3
            before:-z-10
            before:w-full
            before:border-t
            before:border-gray-100
            before:content-['']`}
        >
          <span className="block bg-white px-2 text-weak">
            {t('title')}
          </span>
        </p>
      </div>
      <ul className="container mt-6 flex w-full max-w-[830px] items-center justify-between gap-3
      sm:gap-4 lg:mt-8 lg:justify-around"
      >
        {AS_SEEN_ON_ITEMS.map(item => (
          <li key={item.id} className="flex items-center justify-center">{item.icon}</li>
        ))}
      </ul>
    </div>
  );
};

export default AsSeenOn;
