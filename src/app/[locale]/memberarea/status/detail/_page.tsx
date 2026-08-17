'use client';

import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';
import { formatPhoneNumber } from '@/hooks/format-phone-number';
import { Link } from '@/libs/i18n-routing';
import type { components } from '@/network/api/api';

/**
 * One Location request as the API answers for it. The screen is reached for an
 * answered one, which is the only state carrying a captured position and a
 * resolved address — every one of those fields is optional on the shape because a
 * pending or a rejected request has none of them.
 */
export type LocationRequest = components['schemas']['LocationRequestResponse'];

export const DetailStatusClientPage = ({ locationRequest }: { locationRequest: LocationRequest }) => {
  const [zoom, setZoom] = useState(15);

  const t = useTranslations('pages.status');
  const tCommon = useTranslations('common');

  /*
   * What the request is called: the name the member typed for a link-type one, and
   * the recipient's number for a number-type one. The API sets exactly one of the
   * two, according to the discriminator.
   */
  const title =
    locationRequest.type === 'FIND_BY_LINK'
      ? t('link_name', { name: locationRequest.linkName ?? '' })
      : formatPhoneNumber(locationRequest.phoneNumber ?? undefined).number;

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
    setZoom((prev) => (prev < 20 ? prev + 1 : 15));
  };

  /*
   * Where the recipient was. Absence is tested for rather than falsiness: the prime
   * meridian is a longitude of zero and runs through inhabited places, so a
   * truthiness check would drop a real position on the way to drawing it.
   */
  const { capturedLatitude, capturedLongitude } = locationRequest;
  const capturedPosition =
    capturedLatitude != null && capturedLongitude != null ? { lat: capturedLatitude, lng: capturedLongitude } : null;

  return (
    <div className="flex h-full flex-col gap-4 p-4 lg:p-6">
      <div className="flex items-center gap-1">
        <Button variant="ghost" className="size-12" asChild>
          <Link href={ROUTES.MEMBER.STATUS.HOME} aria-label={tCommon('back')}>
            <Icon name="arrow-left" className="text-neutral" />
          </Link>
        </Button>
        <h1 className="h4 truncate font-bold">{title}</h1>
      </div>
      <div className="relative min-h-[400px] flex-1 overflow-hidden rounded-2xl bg-accent">
        <div className="absolute inset-x-2 bottom-2 z-10 flex gap-1 rounded-lg bg-background p-3 shadow-raised">
          <Icon name="pin-location" className="text-success" />
          <p>{locationRequest.resolvedAddress}</p>
        </div>
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
          {capturedPosition && (
            <Map
              defaultCenter={capturedPosition}
              zoom={zoom}
              gestureHandling="greedy"
              disableDefaultUI
              styles={mapStyles}
            >
              <Marker
                position={capturedPosition}
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
  );
};
