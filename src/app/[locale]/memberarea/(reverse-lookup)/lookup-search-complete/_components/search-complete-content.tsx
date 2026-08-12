'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { OwnerInformationCard } from '@/components/reverse-lookup/owner-information-card';
import type { User } from '@/types/user';

import { ReportReady } from './report-ready';

export const SearchCompleteContent = (
  { phoneNumber, user }: { phoneNumber: string; user: User }) => {
  const t = useTranslations('pages.reverse_lookup.member_area.phone_lookup');
  const [isShowPDF, setIsShowPDF] = useState(false);

  return (
    <main className="flex flex-col px-4 lg:p-6">
      <div className="mb-4 lg:mb-6">
        <h1 className="h3 font-bold">{t('phone_lookup')}</h1>
      </div>
      <section>
        <OwnerInformationCard onProgressComplete={() => setIsShowPDF(true)} phoneNumber={phoneNumber} />
        {isShowPDF && <ReportReady user={user} />}
      </section>
    </main>
  );
};
