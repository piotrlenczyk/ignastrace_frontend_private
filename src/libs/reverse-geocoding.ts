import { importLibrary, setOptions } from '@googlemaps/js-api-loader';

/*
 * js-api-loader v2 retired the `Loader` class in favour of `setOptions` plus
 * `importLibrary`. Options have to be set before the first import, and the
 * loader ignores repeat calls once the API has started loading, so calling this
 * on every geocode is safe.
 */
const loadGeocoding = async (): Promise<google.maps.GeocodingLibrary> => {
  setOptions({
    key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    v: 'weekly',
  });

  return importLibrary('geocoding');
};

export async function reverseGeo(
  lat: number,
  lng: number,
): Promise<string> {
  const { Geocoder } = await loadGeocoding();
  const geocoder = new Geocoder();

  const { results } = await geocoder.geocode({ location: {
    lat,
    lng,
  } });

  if (results && results[0]) {
    return results[0].formatted_address;
  } else {
    throw new Error('No results found');
  }
}
