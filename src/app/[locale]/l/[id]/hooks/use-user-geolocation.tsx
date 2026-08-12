import { useEffect, useState } from 'react';

import { reverseGeo } from '@/libs/reverse-geocoding';

type Status = 'rejected' | 'loading' | 'not_supported' | 'located' | 'error';
type Address = null | string;
type Coords = {
  latitude: number;
  longitude: number;
};

type UserGeolocation = {
  address: Address;
  coords: Coords;
  status: Status;
};

export function useUserGeolocation(): Partial<UserGeolocation> {
  const [address, setAddress] = useState<Address>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [coords, setCoords] = useState<Coords | null>(null);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setStatus('not_supported');
      return;
    }

    const successHandler = async (position: GeolocationPosition) => {
      const newCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setCoords(newCoords);

      try {
        const result = await reverseGeo(
          newCoords.latitude,
          newCoords.longitude,
        );
        setAddress(result);
        setStatus('located');
      } catch {
        setStatus('error');
      }
    };

    const errorHandler = () => {
      setStatus('rejected');
    };

    navigator.geolocation.getCurrentPosition(
      successHandler,
      errorHandler,
      {
        timeout: 300000,
      },
    );
  }, []);

  return {
    address,
    coords: coords || undefined,
    status,
  };
}
