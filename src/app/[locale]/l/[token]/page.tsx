import { getTranslations } from 'next-intl/server';

import { Logotype } from '@/components/logotype';
import { apiServerClient } from '@/network/api/apiServerClient';
import { unwrapApiResponse } from '@/network/http-response-handler';

import { LocationStatus } from './components/location-status';

/*
 * The state of the Consent link a recipient followed, read with no credential.
 *
 * The dynamic segment is the Consent link's opaque token, never the Location
 * request's own id: the sender's request id is not something a recipient is ever
 * shown. Share links the legacy backend issued carry that id instead, so they do
 * not resolve here and land in the expired state — deliberately, with no
 * fallback to the legacy status endpoint.
 *
 * Everything that is not an active link is the same answer to this page. The API
 * refuses an unrecognised token as not-found and a used one as gone, and it never
 * distinguishes a link that was granted from one that was refused, so a refusal
 * needs no branching: it is simply the absence of a state to show.
 */
const consentLinkState = async (token: string) => {
  try {
    return await apiServerClient['/api/v1/consent-links/{token}']
      .GET({ params: { path: { token } } })
      .then(unwrapApiResponse);
  } catch {
    return null;
  }
};

export default async function LocatePage(props: PageProps<'/[locale]/l/[token]'>) {
  const { token } = await props.params;
  const t = await getTranslations('pages.locate');
  const consentLink = await consentLinkState(token);

  return (
    <main className="container-small container grid place-content-center text-center">
      <div className="p-4">
        <Logotype className="mx-auto mb-4" />
        <div>
          {consentLink?.state === 'ACTIVE' ? (
            <LocationStatus token={token} linkName={consentLink.linkName} />
          ) : (
            <div>
              <h1 className="h4 mb-1 font-bold">{t('link_expired')}</h1>
              <p className="min-h-[2lh] text-balance">{t('link_expired_explain')}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
