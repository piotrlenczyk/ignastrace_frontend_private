'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { Footer } from '@/components/footer';
import { Navbar } from '@/components/navigation/navbar';
import { Button } from '@/components/ui/button';
import { Link } from '@/libs/i18n-routing';

export default function GlobalError() {
  const t = useTranslations('pages.error');

  return (
    <div className="layout-default">
      <Navbar />
      <main className="grid place-content-center place-items-center gap-6 p-6 [grid-area:main]">
        <Image
          src="/images/error-page.svg"
          width="360"
          height="254"
          alt=""
          priority
        />

        <h1 className="h3 font-bold">
          {t('title')}
        </h1>
        <p>
          {t('body')}
        </p>

        <Button asChild>
          <Link href="/">
            {t('cta')}
          </Link>
        </Button>
      </main>
      <Footer />
    </div>
  );
};
