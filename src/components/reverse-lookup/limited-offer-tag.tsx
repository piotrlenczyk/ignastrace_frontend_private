import { useTranslations } from 'next-intl';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/libs/utils';

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
      <Icon name="timer" className="size-4" />
      <span className="text-sm font-bold text-primary">{t('limited_offer')}</span>
    </div>
  );
};

export default LimitedOfferTag;
