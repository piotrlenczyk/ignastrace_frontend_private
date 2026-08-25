import { useLocale, useTranslations } from 'next-intl';

import ReverseLookupValue from '@/components/reverse-lookup-value';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/libs/utils';
import type { SectionedReport } from '@/server/getters/reverse-lookup.getters';

import { localeFormatDate } from '../../_page/utils';
import { usePersonalDetailLabels } from '../report-enum-labels';
import { AlertInfo } from './alert-info';

const PossiblePersonalDetails = ({ className, owners }: { className?: string; owners: SectionedReport['owners'] }) => {
  const locale = useLocale();
  const t = useTranslations('pages.reverse_lookup.report.possible_personal_details');
  const tCommon = useTranslations('pages.reverse_lookup.report.common');
  const label = usePersonalDetailLabels();

  const dateOfBirths = owners
    .map((owner) => (owner.dateOfBirth ? localeFormatDate(owner.dateOfBirth, locale) : undefined))
    .filter(Boolean);

  const incomes = owners
    .map((owner) =>
      owner.incomeMin || owner.incomeMax ? `${owner.incomeMin || '...'}-${owner.incomeMax || '...'}` : undefined,
    )
    .filter(Boolean);

  const genders = [...new Set(owners.map((owner) => (owner.gender ? label.gender(owner.gender) : undefined)))].filter(
    Boolean,
  );

  const maritalStatuses = owners
    .map((owner) => (owner.maritalStatus ? label.maritalStatus(owner.maritalStatus) : undefined))
    .filter(Boolean);

  const children = owners
    .map((owner) =>
      owner.hasChildren === true
        ? t(`values.children`, { count: owner.numChildren ?? 0 })
        : owner.hasChildren === false
          ? t(`values.no_children`)
          : undefined,
    )
    .filter(Boolean);

  const householdSize = [
    ...new Set(owners.map((owner) => (owner.householdSize ? owner.householdSize : undefined)).filter(Boolean)),
  ];

  const isEmpty =
    owners.length === 0 ||
    (dateOfBirths.length === 0 &&
      genders.length === 0 &&
      maritalStatuses.length === 0 &&
      incomes.length === 0 &&
      children.length === 0 &&
      householdSize.length === 0);

  const personalData = [
    {
      icon: 'calendar',
      label: t('labels.date_of_birth'),
      value: dateOfBirths,
    },
    {
      icon: 'female',
      label: t('labels.gender'),
      value: genders,
    },
    {
      icon: 'link',
      label: t('labels.marital_status'),
      value: maritalStatuses,
    },
    {
      icon: 'credit-card',
      label: t('labels.income'),
      value: incomes,
    },
    {
      icon: 'star',
      label: t('labels.children'),
      value: children,
    },
    {
      icon: 'user-group',
      label: t('labels.household_size'),
      value: householdSize,
    },
  ] as const;

  return (
    <Card className={cn('flex flex-col gap-6 border-stroke-weak px-4 py-6 shadow-raised lg:px-6', className)}>
      <h4 className="font-bold">{isEmpty ? t('title_empty') : t('title')}</h4>

      <AlertInfo>{t('info')}</AlertInfo>

      {!isEmpty && (
        <div className="grid gap-6 gap-y-4 sm:grid-cols-1 lg:grid-cols-2">
          {personalData.map((item) => (
            <div key={item.label} className="flex items-start gap-2">
              <Icon name={item.icon} className="size-6 text-secondary" />
              <div className="flex flex-1 flex-col gap-0.5 text-lg">
                <p className="font-bold">{item.label}</p>
                <p>
                  <ReverseLookupValue value={item.value} fallbackText={tCommon('no_data')} />
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default PossiblePersonalDetails;
