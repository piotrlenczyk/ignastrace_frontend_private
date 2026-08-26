import { getTranslations } from 'next-intl/server';

import { Locator } from '@/components/homepage/locator';
import WebsiteLayout from '@/components/layouts/website-layout';
import { Icon, type IconName } from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';
import { redirectIfAuthenticated } from '@/libs/subscription';
import { getServerSettings } from '@/settings/settings.server';

type CardType = {
  id: string;
  icon: IconName;
  title: any;
  description: any;
};

const cards: CardType[] = [
  { id: '1', icon: 'globe', title: 'cards.card_1.title', description: 'cards.card_1.description' },
  { id: '2', icon: 'location', title: 'cards.card_2.title', description: 'cards.card_2.description' },
  { id: '3', icon: 'favourite', title: 'cards.card_3.title', description: 'cards.card_3.description' },
  { id: '4', icon: 'globe', title: 'cards.card_4.title', description: 'cards.card_4.description' },
];

const Card = ({ title, description, icon, t }: CardType & { t: any }) => {
  return (
    <article className="flex flex-col gap-4 md:mb-6">
      <div className="brand-icon text-white">
        <Icon name={icon} />
      </div>
      <div>
        <h3 className="mb-1 text-base leading-6 font-semibold text-strong lg:text-lg">{t(title)}</h3>
        <div className="content-html text-weak" dangerouslySetInnerHTML={{ __html: t.raw(description) }} />
      </div>
    </article>
  );
};

export default async function About() {
  await redirectIfAuthenticated({
    activeSubscription: ROUTES.MEMBER.SETTINGS.GET_HELP,
    endedSubscription: ROUTES.MEMBER.SETTINGS.BILLING,
  });

  const country = (await getServerSettings()).countryCode;
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
