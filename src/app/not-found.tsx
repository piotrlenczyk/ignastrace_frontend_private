import Image from 'next/image';
import { useTranslations } from 'next-intl';

import WebsiteLayout from '@/components/layouts/website-layout';
import { Button } from '@/components/ui/button';
import { Link } from '@/libs/i18n-routing';

export default function NotFoundPage() {
  const t = useTranslations('pages.not_found');

  return (
    <WebsiteLayout>
      <main className="grid place-content-center place-items-center gap-6 p-6 [grid-area:main]">
        <Image src="/images/error-page.svg" width="360" height="254" alt="" priority />

        <h1 className="h3 font-bold">{t('title')}</h1>
        <p>{t('body')}</p>

        <Button asChild>
          <Link href="/">{t('cta')}</Link>
        </Button>
      </main>
    </WebsiteLayout>
  );
}
