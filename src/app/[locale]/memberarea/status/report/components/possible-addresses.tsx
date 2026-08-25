import { useTranslations } from 'next-intl';

import ReverseLookupValue from '@/components/reverse-lookup-value';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/libs/utils';
import type { SectionedReport } from '@/server/getters/reverse-lookup.getters';
import { getCountryName } from '@/utils/country-names';

import { AlertInfo } from './alert-info';

const PossibleAddresses = ({ className, owners }: { className?: string; owners: SectionedReport['owners'] }) => {
  const t = useTranslations('pages.reverse_lookup.report.possible_addresses');

  /*
   * Keyed by the owner rather than by the location: the new API states a location
   * inline on its owner and gives it no identifier of its own.
   */
  const locations = owners.flatMap((owner) => (owner.location ? [{ owner: owner.id, ...owner.location }] : []));

  return (
    <Card className={cn('flex flex-col gap-6 border-stroke-weak px-4 py-6 shadow-raised lg:px-6', className)}>
      <h4 className="font-bold">{locations.length === 0 ? t('title_empty') : t('title')}</h4>

      <AlertInfo>{t('info')}</AlertInfo>

      {locations.map((location) => (
        <div key={location.owner} className="flex items-start gap-2">
          <Icon name="pin-location" className="size-6 text-secondary" />
          <div className="flex-1 text-lg leading-8">
            <div>
              <strong>{t('labels.street')}: </strong>
              <ReverseLookupValue value={location.address} />
            </div>
            <div>
              <strong>{t('labels.city')}: </strong>
              <ReverseLookupValue value={location.city} />
            </div>
            <div>
              <strong>{t('labels.county')}: </strong>
              <ReverseLookupValue value={location.county} />
            </div>
            <div>
              <strong>{t('labels.state')}: </strong>
              <ReverseLookupValue value={location.state} />
            </div>
            <div>
              <strong>{t('labels.postal_code')}: </strong>
              <ReverseLookupValue value={location.postalCode} />
            </div>
            <div>
              <strong>{t('labels.country')}: </strong>
              <ReverseLookupValue value={location.country ? getCountryName(location.country) : location.country} />
            </div>
            <div>
              <strong>{t('labels.latitude')}: </strong>
              <ReverseLookupValue value={location.latitude ? location.latitude.toFixed(6) : location.latitude} />
            </div>
            <div>
              <strong>{t('labels.longitude')}: </strong>
              <ReverseLookupValue value={location.longitude ? location.longitude.toFixed(6) : location.longitude} />
            </div>
            <div>
              <strong>{t('labels.length_of_residence')}: </strong>
              <ReverseLookupValue
                value={
                  location.yearsOfResidence
                    ? t('values.years', { count: location.yearsOfResidence })
                    : location.yearsOfResidence
                }
              />
            </div>
          </div>
        </div>
      ))}
    </Card>
  );
};

export default PossibleAddresses;
