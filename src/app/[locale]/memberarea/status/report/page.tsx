import { redirect } from 'next/navigation';

import { ROUTES } from '@/constants/routes';
import { getSubscriptionRedirect } from '@/hooks/get-subscription-redirect';
import { getUser } from '@/libs/subscription';
import { getSectionedReport } from '@/server/getters/reverse-lookup.getters';
import { getServerSession } from '@/server/session/session.utils';
import { getServerSettings } from '@/settings/settings.server';
import { firstValue } from '@/utils/search-params';

import CarrierDetails from './components/carrier-details';
import DataBreachHistory from './components/data-breach-history';
import DownloadPdfButton from './components/download-pdf-button';
import { InPreparation } from './components/in-preparation';
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
  const session = await getServerSession();
  const isAuthenticated = !!session;

  const { reverseLookupEnabled } = await getServerSettings();

  if (!reverseLookupEnabled) {
    redirect(ROUTES.MEMBER.STATUS.HOME);
  }

  const reportId = firstValue(searchParams?.id);

  if (!reportId) {
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

  const [sections, user] = await Promise.all([getSectionedReport(reportId), getUser()]);

  /*
   * A report the backend has not finished is told apart from a report that
   * finished with nothing in it. A `FAILED` one is the latter: it arrives as a 200
   * with empty sections, and every card below already draws its own empty state.
   */
  if (sections.outcome === 'in-preparation') {
    return <InPreparation />;
  }

  const report = sections.data;

  return (
    <>
      <ReportHeader report={report} user={user} />
      <StickyDownloadPdfButton user={user} />
      <div className="flex flex-col gap-4 p-4 lg:px-6">
        <ProfileSummary owners={report.owners} />
        <SexOffendersBackgroundCheck
          sexOffenders={report.sexOffenders}
          owners={report.owners}
          reportId={reportId}
          user={user}
          className="print:hidden"
        />
        <DataBreachHistory dataBreach={report.dataBreach} reportId={reportId} user={user} className="print:hidden" />
        <PhonePublicInformation owners={report.owners} />
        <Photos photos={report.photos} />
        <PossibleContactDetails owners={report.owners} />
        <PossiblePersonalDetails owners={report.owners} />
        <PossibleAddresses owners={report.owners} />
        <PossibleSocialMediaAccounts socialMedia={report.socialMedia} reportId={reportId} />
        <PotentialProfessionalSummary owners={report.owners} />
        <PotentialEducation owners={report.owners} />
        <CarrierDetails profile={report.profile} />
        <DownloadPdfButton user={user} />
      </div>
    </>
  );
};

export default ReportStatusPage;
