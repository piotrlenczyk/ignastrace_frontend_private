import { useLocale, useTranslations } from 'next-intl';

import ReverseLookupValue from '@/components/reverse-lookup-value';
import { Card } from '@/components/ui/card';
import {
  IconCalendarDates,
  IconComponentCard,
  IconEmail,
  IconLocationPinLine,
  IconUsers,
} from '@/components/ui/icon/icons';
import { cn } from '@/libs/utils';
import type { ReverseLookup } from '@/types/reverse-lookup.types';
import { useTranslatedCountryNames } from '@/utils/country-names';

import { localeFormatDate } from '../../_page/utils';

const ProfileSummary = ({ reverseLookup, className }: { reverseLookup: ReverseLookup; className?: string }) => {
  const locale = useLocale();
  const t = useTranslations('pages.reverse_lookup.report.profile_summary');
  const tCommon = useTranslations('pages.reverse_lookup.report.common');

  const usernames = reverseLookup.reverse_lookup_owners.map(owner => owner.usernames).flat();
  const countryCodes = [...new Set(
    reverseLookup.reverse_lookup_owners
      .map(owner => owner.country_code)
      .filter(Boolean),
  )];
  const countries = useTranslatedCountryNames(countryCodes);

  const profileData = [
    {
      icon: IconUsers,
      label: t('possible_owners'),
      value: reverseLookup.reverse_lookup_owners.map(owner => owner.name),
    },
    {
      icon: IconComponentCard,
      label: t('associated_usernames'),
      value: usernames,
    },
    {
      icon: IconEmail,
      label: t('associated_emails'),
      value: reverseLookup.reverse_lookup_owners.map(owner => owner.email),
    },
    {
      icon: IconLocationPinLine,
      label: t('associated_locations'),
      value: countries,
    },
    {
      icon: IconCalendarDates,
      label: t('potential_date_of_birth'),
      value: reverseLookup.reverse_lookup_owners
        .map(owner => owner.date_of_birth ? localeFormatDate(owner.date_of_birth, locale) : null)
        .filter((date): date is string => date !== null),
    },
  ];

  return (
    <Card className={cn('border-stroke-weak px-4 py-6 shadow-raised lg:px-6', className)}>
      <h4 className="mb-6 font-bold lg:mb-5">
        {t('title')}
      </h4>

      <div className="grid gap-4">
        {profileData.map(item => (
          <div key={item.label} className="grid grid-cols-[auto_1fr] items-start gap-2">
            <item.icon className="size-6 text-secondary" />
            <div className="min-w-0 text-lg">
              <p className="mb-0.5 font-bold">
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
    </Card>
  );
};

export default ProfileSummary;
