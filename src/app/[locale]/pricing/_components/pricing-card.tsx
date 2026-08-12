import { getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getFeatures } from '@/libs/server/feature-flags';
import { cn } from '@/libs/utils';

const colors = {
  trial: {
    badge: { text: 'text-secondary', bg: 'bg-secondary-50', border: 'border border-solid border-secondary-200' },
    cta: { bg: 'bg-brand' },
  },
  subscription: {
    badge: { text: 'text-primary', bg: 'bg-primary-50', border: 'border border-solid border-primary-200' },
    cta: { bg: 'bg-primary' },
  },
};

export const PricingCard = async (
  { price, description, type, trialDays }:
  { price: string; description: string; type: 'trial' | 'subscription'; trialDays: number }) => {
  const t = await getTranslations('pages.pricing.cards');

  const { ENABLE_REVERSE_LOOKUP } = await getFeatures();

  const translationKey = trialDays === 1 ? `${type}_24` : type;

  const cardCSS = cn(
    'flex flex-col items-start justify-between gap-6 rounded-xl p-6',
    colors[type].badge.bg,
    colors[type].badge.border,
  );

  const badgeCSS = cn(
    `rounded-full px-2 font-semibold ${colors[type].badge.border} leading-6`,
    colors[type].badge.text,
    colors[type].badge.bg,
  );

  const isReverseLookupVisible = ENABLE_REVERSE_LOOKUP;
  const features = Array.from(
    isReverseLookupVisible ? { length: 5 } : { length: type === 'trial' ? 3 : 4 },
    (_, i) => t(`${translationKey}.${isReverseLookupVisible ? 'new_features' : 'features'}.feature_${i + 1}` as any),
  );

  return (
    <div className={cardCSS}>
      <span className={badgeCSS}>
        {t(`${translationKey}.badge` as any)}
      </span>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h1 className="font-bold">
          {price || <Skeleton className="h-[70px] w-[220px] rounded-md" />}
        </h1>
        <div>
          {t(`${translationKey}.duration` as any)}
        </div>
      </div>

      <div className="text-sm">
        <p className="text-start">{description}</p>
        <ul className="ml-5 mt-4 list-inside list-disc pl-2">
          {features.map(item =>
            <li className="mb-0 -indent-5" key={item}>{item}</li>,
          )}
        </ul>
      </div>

      <Button className={cn('min-w-full', colors[type].cta.bg)} size="lg" asChild>
        <a href={`?plan=${type}#locator`}>
          {t(`${translationKey}.cta` as any)}
        </a>
      </Button>
    </div>
  );
};
