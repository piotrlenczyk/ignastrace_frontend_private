import { useLocale, useTranslations } from 'next-intl';

import ReverseLookupValue from '@/components/reverse-lookup-value';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/libs/utils';
import type { SectionedReport } from '@/server/getters/reverse-lookup.getters';
import { useTranslatedCountryNames } from '@/utils/country-names';

import { localeFormatDate } from '../../_page/utils';

const ProfileSummary = ({ owners, className }: { owners: SectionedReport['owners']; className?: string }) => {
  const locale = useLocale();
  const t = useTranslations('pages.reverse_lookup.report.profile_summary');
  const tCommon = useTranslations('pages.reverse_lookup.report.common');

  const usernames = owners.flatMap((owner) => owner.usernames);
  const countryCodes = [...new Set(owners.map((owner) => owner.countryCode ?? undefined).filter(Boolean))];
  const countries = useTranslatedCountryNames(countryCodes);

  const profileData = [
    {
      icon: 'user-group',
      label: t('possible_owners'),
      value: owners.map((owner) => owner.name ?? undefined),
    },
    {
      icon: 'identification',
      label: t('associated_usernames'),
      value: usernames,
    },
    {
      icon: 'mail',
      label: t('associated_emails'),
      value: owners.map((owner) => owner.email ?? undefined),
    },
    {
      icon: 'pin-location',
      label: t('associated_locations'),
      value: countries,
    },
    {
      icon: 'calendar',
      label: t('potential_date_of_birth'),
      value: owners
        .map((owner) => (owner.dateOfBirth ? localeFormatDate(owner.dateOfBirth, locale) : null))
        .filter((date): date is string => date !== null),
    },
  ] as const;

  return (
    <Card className={cn('border-stroke-weak px-4 py-6 shadow-raised lg:px-6', className)}>
      <h4 className="mb-6 font-bold lg:mb-5">{t('title')}</h4>

      <div className="grid gap-4">
        {profileData.map((item) => (
          <div key={item.label} className="grid grid-cols-[auto_1fr] items-start gap-2">
            <Icon name={item.icon} className="size-6 text-secondary" />
            <div className="min-w-0 text-lg">
              <p className="mb-0.5 font-bold">{item.label}</p>
              <p>
                <ReverseLookupValue value={item.value} fallbackText={tCommon('no_data')} />
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ProfileSummary;
