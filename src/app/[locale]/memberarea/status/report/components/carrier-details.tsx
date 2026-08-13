import { useTranslations } from 'next-intl';

import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/libs/utils';
import type { ReverseLookup } from '@/types/reverse-lookup.types';
import { useTranslatedCountryNames } from '@/utils/country-names';

import { AlertInfo } from './alert-info';

const CarrierDetails = ({ className, reverseLookup }: { className?: string; reverseLookup: ReverseLookup }) => {
  const t = useTranslations('pages.reverse_lookup.report.carrier_details');
  const translatedCountryNames = useTranslatedCountryNames([reverseLookup.country]);
  const translatedCountry = translatedCountryNames[0] || reverseLookup.country;

  const carrierData = [
    {
      icon: 'globe',
      label: t('labels.international_format'),
      value: reverseLookup.phone_formats.international,
    },
    {
      icon: 'location',
      label: t('labels.local_format'),
      value: reverseLookup.phone_formats.local,
    },
    {
      icon: 'pin-location',
      label: t('labels.location'),
      value: translatedCountry,
    },
    {
      icon: 'phone',
      label: t('labels.type'),
      value: t(`line_types.${reverseLookup.line_type}`),
    },
    {
      icon: 'bar-chart',
      label: t('labels.carrier'),
      value: reverseLookup.carrier,
    },
  ] as const;

  return (
    <Card className={cn('flex flex-col gap-6 border-stroke-weak px-4 py-6 shadow-raised lg:px-6', className)}>
      <h4 className="font-bold">{t('title')}</h4>

      <AlertInfo>{t('info')}</AlertInfo>

      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
        {carrierData.map((item) => (
          <div key={item.label} className="flex items-start gap-2">
            <Icon name={item.icon} className="size-6 text-secondary" />
            <div className="flex-1 text-lg">
              <p className="mb-0.5 font-bold">{item.label}</p>
              <p>{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default CarrierDetails;
