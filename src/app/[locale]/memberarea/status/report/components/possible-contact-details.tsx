import { useTranslations } from 'next-intl';

import { Card } from '@/components/ui/card';
import { IconEmail, IconPhone2Line } from '@/components/ui/icon/icons';
import { cn } from '@/libs/utils';
import type { ReverseLookup } from '@/types/reverse-lookup.types';

import { AlertInfo } from './alert-info';

const PossibleContactDetails = ({ className, reverseLookup }: { className?: string; reverseLookup: ReverseLookup }) => {
  const t = useTranslations('pages.reverse_lookup.report.possible_contact_details');

  const emails = reverseLookup.reverse_lookup_owners.map(owner => owner.email).filter(Boolean);
  const phones = reverseLookup.reverse_lookup_owners.map(owner => owner.phone).filter(Boolean);

  const contactsData = [
    {
      icon: IconEmail,
      label: t('labels.associated_emails'),
      values: emails,
    },
    {
      icon: IconPhone2Line,
      label: t('labels.associated_numbers'),
      values: phones,
    },
  ];

  const isEmpty = emails.length === 0 && phones.length === 0;

  return (
    <Card className={cn('py-6 px-4 lg:px-6 shadow-raised border-stroke-weak flex flex-col gap-6', className)}>
      <h4 className="font-bold">
        {isEmpty ? t('title_empty') : t('title')}
      </h4>

      <AlertInfo>
        {t('info')}
      </AlertInfo>

      {!isEmpty && (
        contactsData.map(item => (
          item.values.length > 0 && (
            <div key={item.label} className="grid grid-cols-[auto_1fr] items-start gap-2">
              <item.icon className="size-6 text-secondary" />
              <div className="min-w-0 text-lg">
                <p className="mb-0.5 font-bold">
                  {item.label}
                  :
                </p>
                {item.values.map(value => (
                  <p key={value} className="truncate">{value}</p>
                ))}
              </div>
            </div>
          )
        )))}
    </Card>
  );
};

export default PossibleContactDetails;
