import { useTranslations } from 'next-intl';

import WebsiteLayout from '@/components/layouts/website-layout';
import { Link } from '@/libs/i18n-routing';

import { CancellationForm } from './_components/cancellation-form';
import { Info } from './_components/info';

export default function Cancellation() {
  const t = useTranslations('pages.cancellation');

  return (
    <WebsiteLayout>
      <main className="p-6 [grid-area:main]">
        <div className="container-content flex max-w-[560px] flex-col gap-6">
          <h1 className="h1 font-bold">{t('title')}</h1>
          <p>{t('subtitle')}</p>

          <CancellationForm />

          <Info
            icon="mail-account"
            description={t.rich('info_email', {
              link: (chunks) => (
                <Link className="underline underline-offset-2" href="/contact">
                  {chunks}
                </Link>
              ),
            })}
          />

          <Info icon="user-account" description={t('info_user')} />
        </div>
      </main>
    </WebsiteLayout>
  );
}
