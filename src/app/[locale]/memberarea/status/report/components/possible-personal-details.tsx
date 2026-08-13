import { useLocale, useTranslations } from 'next-intl';

import ReverseLookupValue from '@/components/reverse-lookup-value';
import { Card } from '@/components/ui/card';
import {
  IconCalendarDate,
  IconGender,
  IconLinkAlt02,
  IconStarLine,
  IconUsersGroup,
  IconWallet,
} from '@/components/ui/icon/icons';
import { cn } from '@/libs/utils';
import type { ReverseLookup } from '@/types/reverse-lookup.types';

import { localeFormatDate } from '../../_page/utils';
import { AlertInfo } from './alert-info';

const PossiblePersonalDetails = ({
  className,
  reverseLookup,
}: { className?: string; reverseLookup: ReverseLookup }) => {
  const locale = useLocale();
  const t = useTranslations('pages.reverse_lookup.report.possible_personal_details');
  const tCommon = useTranslations('pages.reverse_lookup.report.common');

  const dateOfBirths = reverseLookup.reverse_lookup_owners
    .map(owner => owner.date_of_birth ? localeFormatDate(owner.date_of_birth, locale) : undefined)
    .filter(Boolean);

  const incomes = reverseLookup.reverse_lookup_owners.map(owner =>
    owner.income_min || owner.income_max
      ? `${owner.income_min || '...'}-${owner.income_max || '...'}`
      : undefined,
  ).filter(Boolean);

  const genders = [...new Set(reverseLookup.reverse_lookup_owners.map(owner =>
    owner.gender ? t(`values.${owner.gender}`) : undefined,
  ).filter(Boolean))];

  const maritalStatuses = reverseLookup.reverse_lookup_owners.map(owner =>
    owner.marital_status ? t(`values.${owner.marital_status}`) : undefined,
  ).filter(Boolean);

  const children = reverseLookup.reverse_lookup_owners.map(owner =>
    owner.has_children === true
      ? t(`values.children`, { count: owner.num_children ?? 0 })
      : owner.has_children === false
        ? t(`values.no_children`)
        : undefined,
  ).filter(Boolean);

  const householdSize = [...new Set(reverseLookup.reverse_lookup_owners.map(owner =>
    owner.household_size ? owner.household_size : undefined,
  ).filter(Boolean))];

  const isEmpty = reverseLookup.reverse_lookup_owners.length === 0
    || (dateOfBirths.length === 0
      && genders.length === 0
      && maritalStatuses.length === 0
      && incomes.length === 0
      && children.length === 0
      && householdSize.length === 0);

  const personalData = [
    {
      icon: IconCalendarDate,
      label: t('labels.date_of_birth'),
      value: dateOfBirths,
    },
    {
      icon: IconGender,
      label: t('labels.gender'),
      value: genders,
    },
    {
      icon: IconLinkAlt02,
      label: t('labels.marital_status'),
      value: maritalStatuses,
    },
    {
      icon: IconWallet,
      label: t('labels.income'),
      value: incomes,
    },
    {
      icon: IconStarLine,
      label: t('labels.children'),
      value: children,
    },
    {
      icon: IconUsersGroup,
      label: t('labels.household_size'),
      value: householdSize,
    },
  ];
  return (
    <Card className={cn('flex flex-col gap-6 border-stroke-weak px-4 py-6 shadow-raised lg:px-6', className)}>
      <h4 className="font-bold">
        {isEmpty ? t('title_empty') : t('title')}
      </h4>

      <AlertInfo>
        {t('info')}
      </AlertInfo>

      {!isEmpty && (
        <div className="grid gap-6 gap-y-4 sm:grid-cols-1 lg:grid-cols-2">
          {personalData.map(item => (
            <div key={item.label} className="flex items-start gap-2">
              <item.icon className="size-6 text-secondary" />
              <div className="flex flex-1 flex-col gap-0.5 text-lg">
                <p className="font-bold">
                  {item.label}
                </p>
                <p>
                  <ReverseLookupValue
                    value={item.value}
                    fallbackText={tCommon('no_data')}
                  />
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
