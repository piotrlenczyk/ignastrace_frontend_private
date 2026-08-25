import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import { useLocale, useTranslations } from 'next-intl';

import { Card } from '@/components/ui/card';
import { cn } from '@/libs/utils';
import type { SexOffenderDetail } from '@/server/getters/reverse-lookup.getters';
import { getCountryName } from '@/utils/country-names';

const AddressRow = ({ label, value }: { label: string; value: string | number }) => (
  <div className="block border-b border-gray-100 pb-3 text-lg md:flex md:gap-3">
    <h5 className="mb-1 w-60 font-bold md:mb-0">{label}</h5>
    <p>{value ?? '--'}</p>
  </div>
);

const AddressInformationComponent = ({ className, record }: { className?: string; record: SexOffenderDetail }) => {
  const t = useTranslations('pages.reverse_lookup.report.sex_offenders.report.address_information');
  const locale = useLocale();

  const location = record.location;

  const addressData = [
    { label: t('street'), value: location?.address || '--' },
    { label: t('city'), value: location?.city || '--' },
    { label: t('county'), value: location?.county || '--' },
    { label: t('state'), value: location?.state || '--' },
    { label: t('postal_code'), value: location?.postalCode || '--' },
    { label: t('country'), value: location?.country ? getCountryName(location.country, locale) : '--' },
    { label: t('latitude'), value: location?.latitude?.toFixed(6) || '--' },
    { label: t('longitude'), value: location?.longitude?.toFixed(6) || '--' },
    { label: t('length_of_residence'), value: location?.yearsOfResidence || '--' },
  ];

  const locationCoordinates =
    location?.latitude && location?.longitude
      ? {
          lat: location.latitude,
          lng: location.longitude,
        }
      : undefined;

  const zoom = 15;

  const mapStyles = [
    {
      featureType: 'all',
      elementType: 'all',
      stylers: [{ saturation: -100 }],
    },
    {
      featureType: 'all',
      elementType: 'geometry.fill',
      stylers: [{ weight: '2.00' }],
    },
    {
      featureType: 'all',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#9c9c9c' }],
    },
  ];

  const handleMarkerClick = () => {
    const url = `https://www.google.com/maps?q=${locationCoordinates?.lat},${locationCoordinates?.lng}`;
    window.open(url, '_blank');
  };

  return (
    <Card className={cn('flex flex-col gap-6 border border-stroke-weak p-6 shadow-raised', className)}>
      <h4 className="font-bold">{t('title')}</h4>

      <div className="space-y-4">
        {addressData.map((item) => (
          <AddressRow key={item.label} label={item.label} value={item.value} />
        ))}
      </div>

      {locationCoordinates && (
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
          <div className="h-[280px] w-full overflow-hidden rounded-2xl print:hidden">
            <Map
              defaultCenter={locationCoordinates}
              zoom={zoom}
              gestureHandling="greedy"
              disableDefaultUI
              styles={mapStyles}
            >
              <Marker
                position={locationCoordinates}
                onClick={handleMarkerClick}
                icon={{
                  url: '/images/map-pulse-dot.svg',
                  scaledSize: { width: 80, height: 80, equals: () => true },
                  anchor: { x: 40, y: 40, equals: () => true },
                }}
              />
            </Map>
          </div>
        </APIProvider>
      )}
    </Card>
  );
};
export default AddressInformationComponent;
