import { useTranslations } from 'next-intl';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/libs/utils';

export const HowDoesItWork = ({ className }: { className?: string }) => {
  const t = useTranslations('pages.index.how_does_it_work');

  const items = [
    {
      title: t('step_1.title'),
      description: t('step_1.description'),
      icon: 'phone',
      number: '01',
    },
    {
      title: t('step_2.title'),
      description: t('step_2.description'),
      icon: 'send',
      number: '02',
    },
    {
      title: t('step_3.title'),
      description: t('step_3.description'),
      icon: 'location',
      number: '03',
    },
  ] as const;

  return (
    <section className={cn(className, 'px-5 py-8 lg:px-0 lg:py-16')}>
      <h2 className="mb-8 h1 lg:mb-16">{t('title')}</h2>
      <ol className="grid gap-12 lg:grid-cols-3 lg:gap-8">
        {items.map((item) => (
          <li
            key={item.number}
            className={`
              relative [counter-increment:step-counter]
              before:absolute before:top-[-8px] before:right-[8px] before:z-[-1] before:font-bebas before:text-[88px]
              before:leading-none before:text-disabled before:content-['0'_counter(step-counter)]
            `}
          >
            <article>
              <div className="brand-icon-strong mb-4">
                <Icon name={item.icon} />
              </div>
              <h2 className="h5 mb-2 font-semibold text-strong">{item.title}</h2>
              <p className="text-weak">{item.description}</p>
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
};
