import type { CountryCode } from 'libphonenumber-js';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { IconLocationMy, IconLock, IconShieldCheck } from '../ui/icon/icons';
import { Card } from './card';
import { PhoneInput } from './phoneInput';

const trustItems = [
  {
    title: 'secure',
    description: 'ssl_encription',
    icon: IconLock,
  },
  {
    title: '100',
    description: 'confidential',
    icon: IconShieldCheck,
  },
] as const;

const Trust = () => {
  const t = useTranslations('pages.index.hero');

  return (
    <section className="grid w-full grid-cols-1 gap-4 xs:grid-cols-2 lg:flex lg:gap-3">
      {trustItems.map((item) => (
        <div
          key={item.title}
          className="flex items-center justify-items-center gap-3 rounded-md bg-weak p-2 backdrop-blur-xl"
        >
          <item.icon size="large" className="text-secondary" />
          <div>
            <div className="text-sm font-bold text-strong">{t(item.title)}</div>
            <div className="text-xs">{t(item.description)}</div>
          </div>
        </div>
      ))}
    </section>
  );
};

export const HeroLocator = ({
  className,
  defaultCountry,
}: {
  className?: string;
  defaultCountry: CountryCode;
}) => {
  const t = useTranslations('components.phone_input');

  return (
    <section className={className}>
      <p
        className="pb-2 text-base font-semibold leading-normal text-strong
      lg:relative lg:mb-3 lg:p-0 lg:text-2xl lg:font-normal lg:leading-7"
      >
        {t('label')}
      </p>
      <PhoneInput defaultCountry={defaultCountry} />
    </section>
  );
};

const Iphone = () => {
  const t = useTranslations('pages.index.hero');

  return (
    <aside className="hidden  lg:absolute lg:right-[16px] lg:top-[-24px] lg:block ">
      <Card
        className="absolute -left-8 top-24 max-w-[320px] translate-y-5
      animate-[0.5s_fade-in-slide-up_1s_ease_forwards] p-6 opacity-0"
      >
        <div className="mb-4 flex items-center gap-3 text-secondary">
          <div
            className="flex size-10 shrink-0 items-center justify-center
          self-start rounded-xl bg-secondary-strong text-[white]"
          >
            <IconLocationMy size="large" />
          </div>
          <p className="h5 font-semibold text-secondary ">{t('card_title')}</p>
        </div>
        <p className="mb-2 font-semibold">{t('card_phone')}</p>
        <p className="mb-1 text-sm">{t('card_address')}</p>
        <p className="text-sm font-bold">{t('card_date')}</p>
      </Card>
      <Image
        src="/images/hero/iphone.png"
        alt={t('iphone_alt')}
        width={390}
        height={720}
        priority
      />
    </aside>
  );
};

export const Hero = ({ defaultCountry }: { defaultCountry: CountryCode }) => {
  const t = useTranslations('pages.index.hero');
  const title = t.rich('title', {
    underlined: (chunks) => <mark className="text-brand">{chunks}</mark>,
  });
  const subtitle = t('subtitle');

  return (
    <section
      className="flex w-full items-center bg-alternate bg-[-410px_-80px] bg-no-repeat px-6 lg:min-h-[681px]
                   lg:rounded-3xl lg:bg-[right_top] "
      style={{ backgroundImage: 'url(/images/hero/map.png)' }}
    >
      <div className="container-wide relative py-10">
        <h1 className="display mb-10 text-balance lg:relative lg:p-0 lg:pb-12 lg:pr-[580px]">
          {title}
        </h1>
        <HeroLocator
          className="mb-4 lg:max-w-[514px] xl:max-w-screen-sm"
          defaultCountry={defaultCountry}
        />
        <h2 className="mb-4 text-sm font-normal text-weak lg:max-w-[514px] xl:max-w-screen-sm">
          {subtitle}
        </h2>
        <Trust />
        <Iphone />
      </div>
    </section>
  );
};
