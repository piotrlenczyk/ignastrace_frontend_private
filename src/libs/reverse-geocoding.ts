import { Loader } from '@googlemaps/js-api-loader';

const loadScript = async (): Promise<void> => {
  const loader = new Loader({
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    version: 'weekly',
  });

  await loader.load();
};

export async function reverseGeo(
  lat: number,
  lng: number,
): Promise<string> {
  await loadScript();
  const geocoder = new google.maps.Geocoder();

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
