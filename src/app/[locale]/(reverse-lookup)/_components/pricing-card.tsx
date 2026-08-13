import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/libs/utils';

const colors = {
  trial: {
    badge: {
      text: 'text-secondary',
      bg: 'bg-secondary-50',
      border: 'outline-secondary-200',
    },
    cta: { bg: 'bg-brand' },
  },
  subscription: {
    badge: {
      text: 'text-primary',
      bg: 'bg-primary-50',
      border: 'outline-primary-200',
    },
    cta: { bg: 'bg-primary' },
  },
};

export const PricingCard = ({
  price,
  description,
  type,
}: {
  price: string;
  description: string;
  type: 'trial' | 'subscription';
}) => {
  const t = useTranslations('pages.reverse_lookup.components.pricing.cards');

  // outline-3, not outline: v4's bare `outline` sets a 1px width, where v3 left
  // it at the browser default (medium, 3px). See docs/tailwind-v4-migration-notes.md.
  const cardCSS = cn(
    'flex flex-col items-start justify-between gap-6 rounded-xl p-6 outline-3 outline-offset-[-1px]',
    colors[type].badge.bg,
    colors[type].badge.border,
  );

  const badgeCSS = cn(
    'rounded-2xl px-3 py-1 text-base font-semibold outline-3 outline-offset-[-1px]',
    colors[type].badge.border,
    colors[type].badge.text,
    colors[type].badge.bg,
  );

  const features = Array.from({ length: 5 }, (_, i) => t(`${type}.features.feature_${i + 1}` as any));

  return (
    <div className={cardCSS}>
      <span className={badgeCSS}>{t(`${type}.badge` as any)}</span>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h1 className="h3 font-bold">{price || <Skeleton className="h-[70px] w-[220px] rounded-md" />}</h1>
        <div>{t(`${type}.duration` as any)}</div>
      </div>

      <div className="text-sm">
        <p className="text-start">{description}</p>
        <ul className="mt-4 list-outside list-disc pl-5">
          {features.map((item) => (
            <li className="" key={item}>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <Button className={cn('min-w-full', colors[type].cta.bg)} size="lg" asChild>
        <a href="#locator">{t(`${type}.cta` as any)}</a>
      </Button>
    </div>
  );
};
