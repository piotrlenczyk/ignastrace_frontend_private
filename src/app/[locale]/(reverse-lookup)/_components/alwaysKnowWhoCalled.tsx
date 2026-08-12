import { useTranslations } from 'next-intl';

import { Card } from '@/components/homepage/card';
import {
  IconAnnotationText,
  IconChat,
  IconEmail,
  IconGlobeAlt,
  IconLocationPinLine,
  IconSearch,
  IconUsersGroup,
} from '@/components/ui/icon/icons';
import { cn } from '@/libs/utils';

export const AlwaysKnowWhoCalled = ({ className }: { className?: string }) => {
  const t = useTranslations('pages.reverse_lookup.components.always_know_who_called');

  const items = [
    {
      title: t('step_1.title'),
      description: t('step_1.description'),
      icon: IconSearch,
      number: 1,
    },
    {
      title: t('step_2.title'),
      description: t('step_2.description'),
      icon: IconLocationPinLine,
      number: 2,
    },
    {
      title: t('step_3.title'),
      description: t('step_3.description'),
      icon: IconUsersGroup,
      number: 3,
    },
    {
      title: t('step_4.title'),
      description: t('step_4.description'),
      icon: IconChat,
      number: 4,
    },
    {
      title: t('step_5.title'),
      description: t('step_5.description'),
      icon: IconEmail,
      number: 5,
    },
    {
      title: t('step_6.title'),
      description: t('step_6.description'),
      icon: IconAnnotationText,
      number: 6,
    },
    {
      title: t('step_7.title'),
      description: t('step_7.description'),
      icon: IconGlobeAlt,
      number: 7,
    },
  ];

  return (
    <section className={`${className} px-4 py-8 lg:px-0 lg:py-16`}>
      <div className="container max-w-[950px] lg:text-center">
        <h2 className="h3 mb-3 font-bold lg:mb-2">
          { t('title')}
        </h2>
        <p className="text-lg text-weak">
          {t.raw('subtitle')}
        </p>
      </div>
      <div
        className="grid w-full gap-4 pt-6 sm:grid-cols-2 md:grid md:grid-cols-3 md:gap-8 md:pt-14"
      >
        {
          items.map(item => (
            <Card
              key={item.number}
              className={cn('flex gap-4 p-4 shadow-raised')}
            >
              <div
                className="brand-icon-secondary-weak size-10 shrink-0"
              >
                <item.icon size="large" className="text-secondary" />
              </div>
              <div className="flex flex-col">
                <h3 className="mb-1 text-base font-semibold text-strong">{item.title}</h3>
                <p className="text-sm leading-5 text-weak">{item.description}</p>
              </div>
            </Card>
          ))
        }
      </div>
    </section>
  );
};
