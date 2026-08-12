'use client';

import { useRouter } from 'next/navigation';

import { OwnerInformationCard } from '@/components/reverse-lookup/owner-information-card';
import { ROUTES } from '@/constants/routes';

import AsSeenOn from '../../_components/as-seen-on';
import { CustomerSayAbout } from './customer-say-about';

export const SearchCompleteContent = ({ phoneNumber }: { phoneNumber: string }) => {
  const router = useRouter();

  const onNavigateToSignUp = () => router.push(ROUTES.REVERSE_LOOKUP.SIGN_UP);

  return (
    <main className="s-main overflow-hidden px-4 pb-10 lg:mt-10">
      <section className="container-wide">
        <OwnerInformationCard onProgressComplete={() => onNavigateToSignUp()} phoneNumber={phoneNumber} isFunnel />
        <CustomerSayAbout className="mt-4 lg:mt-12" />
        <AsSeenOn className="mt-10 lg:mb-8 lg:mt-10" />
      </section>
    </main>
  );
};
