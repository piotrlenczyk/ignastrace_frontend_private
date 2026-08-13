import { getTranslations } from 'next-intl/server';

import { Locator } from '@/components/homepage/locator';
import WebsiteLayout from '@/components/layouts/website-layout';
import { IconFlagLine, IconGlobeLine, IconLocationMy, IconThumbsUpLine } from '@/components/ui/icon/icons';
import { ROUTES } from '@/constants/routes';
import { useAuthenticatedRedirect } from '@/hooks/use-auth-redirect';
import { getUserCountry } from '@/libs/server/user-country';

type CardType = {
  id: string;
  Icon: typeof IconGlobeLine;
  title: any;
  description: any;
};

const cards: CardType[] = [
  { id: '1', Icon: IconFlagLine, title: 'cards.card_1.title', description: 'cards.card_1.description' },
  { id: '2', Icon: IconLocationMy, title: 'cards.card_2.title', description: 'cards.card_2.description' },
  { id: '3', Icon: IconThumbsUpLine, title: 'cards.card_3.title', description: 'cards.card_3.description' },
  { id: '4', Icon: IconGlobeLine, title: 'cards.card_4.title', description: 'cards.card_4.description' },
];

const Card = ({ title, description, Icon, t }: CardType & { t: any }) => {
  return (
    <article className="flex flex-col gap-4 md:mb-6">
      <div
        className="brand-icon text-white"
      >
        <Icon size="large" />
      </div>
      <div>
        <h3 className="mb-1 text-base leading-6 font-semibold text-strong lg:text-lg">
          {t(title) }
        </h3>
        <div className="content-html text-weak" dangerouslySetInnerHTML={{ __html: t.raw(description) }} />
      </div>
    </article>
  );
};

export default async function About() {
  await useAuthenticatedRedirect({
    activeSubscriptionRoute: ROUTES.MEMBER.SETTINGS.GET_HELP,
    endedSubscriptionRoute: ROUTES.MEMBER.SETTINGS.BILLING,
  });

  const country = await getUserCountry();
  const t = await getTranslations('pages.about');

  return (
    <WebsiteLayout>
      <main className="p-6 [grid-area:main]">
        <div className="container-wide">
          <section className="md:py-8">
            <h1 className="mb-2 font-bold md:mb-8">{t('title')}</h1>
            <p className="md:text-lg">{t('description')}</p>
          </section>
          <section className="grid gap-6 pt-8 md:grid-cols-2 md:gap-8">
            {cards.map((item: CardType) => (
              <Card key={item.id} {...item} t={t} />
            ))}
          </section>
          <Locator
            defaultCountry={country}
            className="my-8 md:mx-auto md:max-w-(--breakpoint-sm) md:py-14"
            labelClassName="font-bold"
          />
        </div>
      </main>
    </WebsiteLayout>
  );
}
