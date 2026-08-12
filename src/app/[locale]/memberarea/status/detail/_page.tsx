'use client';

import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { IconArrowLeft, IconLocationPinCheck } from '@/components/ui/icon/icons';
import { ROUTES } from '@/constants/routes';
import { usePhoneNumberFormatter } from '@/hooks/use-phone-number-formatter';
import { Link } from '@/libs/i18n-routing';
import type { Location } from '@/types/location';

export const DetailStatusClientPage = ({ location }: { location: Location }) => {
  const [zoom, setZoom] = useState(15);

  const t = useTranslations('pages.status');
  const tCommon = useTranslations('common');
  const formattedPhone = usePhoneNumberFormatter(location.phone);

  const mapStyles = [
    {
      featureType: 'all',
      elementType: 'all',
      stylers: [{ saturation: -100 }],
    },
    {
      featureType: 'poi',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'transit',
      stylers: [{ visibility: 'off' }],
    },
  ];

  const handleMarkerClick = () => {
    setZoom(prev => prev < 20 ? prev + 1 : 15);
  };

  return (
    <>
      {location && (
        <div className="flex h-full flex-col gap-4 p-4 lg:p-6">
          <div className="flex items-center gap-1">
            <Button variant="ghost" className="size-12" asChild>
              <Link href={ROUTES.MEMBER.STATUS.HOME} aria-label={tCommon('back')}>
                <IconArrowLeft size="large" className="text-neutral" />
              </Link>
            </Button>
            <h1 className="h4 truncate font-bold">
              {location.type === 'LinkLocation'
                ? t('link_name', { name: location.name })
                : formattedPhone.number}
            </h1>
          </div>
          <div className="relative min-h-[400px] flex-1 overflow-hidden rounded-2xl bg-accent">
            <div className="absolute inset-x-2 bottom-2 z-10 flex gap-1 rounded-lg bg-background p-3 shadow-raised">
              <IconLocationPinCheck size="large" className="text-success" />
              <p>{location.address}</p>
            </div>
            <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
              {location.lat && location.lon && (
                <Map
                  defaultCenter={{ lat: location.lat, lng: location.lon }}
                  zoom={zoom}
                  gestureHandling="greedy"
                  disableDefaultUI
                  styles={mapStyles}
                >
                  <Marker
                    position={{ lat: location.lat, lng: location.lon }}
                    onClick={handleMarkerClick}
                    icon={{
                      url: '/images/map-pulse-dot.svg',
                      scaledSize: { width: 80, height: 80, equals: () => true },
                      anchor: { x: 40, y: 40, equals: () => true },
                    }}
                  />
                </Map>
              )}
            </APIProvider>
          </div>
        </div>
      )}
    </>
  );
};
