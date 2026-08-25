import { useTranslations } from 'next-intl';

import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/libs/utils';
import type { SectionedReport } from '@/server/getters/reverse-lookup.getters';

import { AlertInfo } from './alert-info';

const PossibleContactDetails = ({ className, owners }: { className?: string; owners: SectionedReport['owners'] }) => {
  const t = useTranslations('pages.reverse_lookup.report.possible_contact_details');

  const emails = owners.map((owner) => owner.email).filter((email): email is string => Boolean(email));
  const phones = owners.map((owner) => owner.phone).filter((phone): phone is string => Boolean(phone));

  const contactsData = [
    {
      icon: 'mail',
      label: t('labels.associated_emails'),
      values: emails,
    },
    {
      icon: 'phone',
      label: t('labels.associated_numbers'),
      values: phones,
    },
  ] as const;

  const isEmpty = emails.length === 0 && phones.length === 0;

  return (
    <Card className={cn('flex flex-col gap-6 border-stroke-weak px-4 py-6 shadow-raised lg:px-6', className)}>
      <h4 className="font-bold">{isEmpty ? t('title_empty') : t('title')}</h4>

      <AlertInfo>{t('info')}</AlertInfo>

      {!isEmpty &&
        contactsData.map(
          (item) =>
            item.values.length > 0 && (
              <div key={item.label} className="grid grid-cols-[auto_1fr] items-start gap-2">
                <Icon name={item.icon} className="size-6 text-secondary" />
                <div className="min-w-0 text-lg">
                  <p className="mb-0.5 font-bold">{item.label}:</p>
                  {item.values.map((value) => (
                    <p key={value} className="truncate">
                      {value}
                    </p>
                  ))}
                </div>
              </div>
            ),
        )}
    </Card>
  );
};

export default PossibleContactDetails;
