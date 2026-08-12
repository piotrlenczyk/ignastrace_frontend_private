import { useTranslations } from 'next-intl';

import { cn } from '@/libs/utils';

import { IconAlarm } from '../ui/icon/icons';

type LimitedOfferTagProps = {
  className?: string;
};

const LimitedOfferTag = ({ className }: LimitedOfferTagProps) => {
  const t = useTranslations('pages.reverse_lookup.components.limited_offer_tag');
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-1 rounded-md border border-primary-200 bg-primary-50 px-2 py-1',
        className,
      )}
    >
      <IconAlarm className="size-4" />
      <span className="text-sm font-bold text-primary">{t('limited_offer')}</span>
    </div>
  );
};

export default LimitedOfferTag;
