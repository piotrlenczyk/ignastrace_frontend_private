/**
 * How an array parameter is written into a query string.
 *
 * Its own module because both clients need it and neither can import the other:
 * the server client reaches for the session and next-intl's server getter, so a
 * page script that imported it would pull all of that into the browser bundle.
 *
 * Both sides have to agree on this. The proxy forwards the query string it is
 * given verbatim, so a browser call that serialised an array differently would
 * have the API read something other than what the same call reads from the
 * server.
 */
export const QUERY_SERIALIZER = {
  array: {
    style: 'form' as const,
    explode: false,
  },
};
