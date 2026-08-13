import { redirect } from 'next/navigation';

import { ROUTES } from '@/constants/routes';
import { getSubscriptionRedirect } from '@/hooks/get-subscription-redirect';
import { getApi } from '@/libs/server/api';
import { getFeatures } from '@/libs/server/feature-flags';
import { getSession } from '@/server/session/session.server';
import type { ReverseLookup } from '@/types/reverse-lookup.types';
import type { User } from '@/types/user';

import CarrierDetails from './components/carrier-details';
import DataBreachHistory from './components/data-breach-history';
import DownloadPdfButton from './components/download-pdf-button';
import PhonePublicInformation from './components/phone-public-information';
import PossibleAddresses from './components/possible-addresses';
import PossibleContactDetails from './components/possible-contact-details';
import PossiblePersonalDetails from './components/possible-personal-details';
import PossibleSocialMediaAccounts from './components/possible-social-media-accounts';
import PotentialEducation from './components/potential-education';
import PotentialProfessionalSummary from './components/potential-professional-summary';
import ProfileSummary from './components/profile-summary';
import ReportHeader from './components/report-header';
import Photos from './components/report-photos';
import SexOffendersBackgroundCheck from './components/sex-offenders-background-check';
import StickyDownloadPdfButton from './components/sticky-download-pdf-button';

export const dynamic = 'force-dynamic';

const ReportStatusPage = async (props: PageProps<'/[locale]/memberarea/status/report'>) => {
  const searchParams = await props.searchParams;
  const session = await getSession();
  const isAuthenticated = !!session;

  const { ENABLE_REVERSE_LOOKUP } = await getFeatures();

  if (!ENABLE_REVERSE_LOOKUP) {
    redirect(ROUTES.MEMBER.STATUS.HOME);
  }

  if (!searchParams?.id) {
    redirect(ROUTES.MEMBER.STATUS.HOME);
  }

  if (!isAuthenticated) {
    redirect(ROUTES.HOME);
  }

  const redirectUrl = await getSubscriptionRedirect({
    routes: {
      noSubscription: ROUTES.HOME,
      endedSubscription: ROUTES.MEMBER.SETTINGS.BILLING,
    },
  });

  if (redirectUrl) {
    redirect(redirectUrl);
  }

  const api = await getApi();
  const [reverseLookup, user] = await Promise.all([
    api.get<ReverseLookup>(`/reverse_lookups/${searchParams?.id}`),
    api.get<User>('/user?expand=purchase_info'),
  ]);

  return (
    <>
      <ReportHeader reverseLookup={reverseLookup} user={user} />
      <StickyDownloadPdfButton user={user} />
      <div className="flex flex-col gap-4 p-4 lg:px-6">
        <ProfileSummary reverseLookup={reverseLookup} />
        <SexOffendersBackgroundCheck reverseLookup={reverseLookup} user={user} className="print:hidden" />
        <DataBreachHistory reverseLookup={reverseLookup} user={user} className="print:hidden" />
        <PhonePublicInformation reverseLookup={reverseLookup} />
        <Photos reverseLookup={reverseLookup} />
        <PossibleContactDetails reverseLookup={reverseLookup} />
        <PossiblePersonalDetails reverseLookup={reverseLookup} />
        <PossibleAddresses reverseLookup={reverseLookup} />
        <PossibleSocialMediaAccounts reverseLookup={reverseLookup} />
        <PotentialProfessionalSummary reverseLookup={reverseLookup} />
        <PotentialEducation reverseLookup={reverseLookup} />
        <CarrierDetails reverseLookup={reverseLookup} />
        <DownloadPdfButton user={user} />
      </div>
    </>
  );
};

export default ReportStatusPage;
