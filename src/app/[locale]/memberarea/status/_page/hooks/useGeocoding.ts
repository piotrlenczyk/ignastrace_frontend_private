import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { useEffect, useMemo, useState } from 'react';

export const useGeocoding = (lat: number, lon: number) => {
  const geocodingLib = useMapsLibrary('geocoding');
  const [state, setState] = useState({
    loading: true,
    error: false,
    address: '',
  });

  const geocoder = useMemo(() => geocodingLib && new geocodingLib.Geocoder(), [geocodingLib]);

  useEffect(() => {
    if (!geocoder || !lat || !lon) {
      setState({
        loading: false,
        error: true,
        address: '',
      });
      return;
    }

    const latlng = { lat, lng: lon };

    geocoder.geocode({ location: latlng }, (results, status) => {
      setState({
        loading: false,
        error: status !== 'OK',
        address: status === 'OK' && results?.[0] ? results[0].formatted_address : '',
      });
    });
  }, [geocoder, lat, lon]);

  return state;
};
