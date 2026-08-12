import type { CountryCode } from 'libphonenumber-js';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';

import { IconLock, IconShieldCheck } from '@/components/ui/icon/icons';

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
  const t = useTranslations('pages.reverse_lookup.components.hero');

  return (
    <section className="grid w-full grid-cols-1 gap-4 xs:grid-cols-2 lg:flex lg:gap-3">
      {
        trustItems.map(item => (
          <div
            key={item.title}
            className="
              flex items-center justify-items-center gap-1 rounded-md bg-weak p-1 backdrop-blur-xl lg:gap-2 lg:p-2"
          >
            <item.icon className="size-4lg:size-5 text-secondary" />
            <div className="
              justify-center
              gap-1
              text-[10px] leading-snug lg:flex lg:flex-col lg:gap-0 lg:p-1 lg:text-xs"
            >
              <span className="mr-0.5 font-bold">{`${t(item.title)} `}</span>
              <span>{t(item.description)}</span>
            </div>
          </div>
        ))
      }
    </section>
  );
};

const Iphone = ({ locale }: { locale: string }) => {
  const t = useTranslations('pages.reverse_lookup.components.hero');

  return (
    <aside className="relative hidden lg:flex lg:items-center">
      <Image
        src={`/images/reverse-lookup/phone/iphone_${locale}.png`}
        alt={t('iphone_alt')}
        className="absolute bottom-[-64px] ml-2"
        width={486}
        height={717}
        priority
      />
    </aside>
  );
};

export const Hero = ({ defaultCountry }: { defaultCountry: CountryCode }) => {
  const t = useTranslations('pages.reverse_lookup.components.hero');
  const title = t.rich('title', { mark: chunks => <mark className="text-brand">{chunks}</mark> });
  const subtitle = t('subtitle');
  const locale = useLocale();

  return (
    <section className="px-2 lg:px-0">
      <div
        className="flex w-full rounded-3xl bg-alternate bg-[-410px_-80px] bg-no-repeat px-4 lg:min-h-[680px]
                   lg:bg-[right_top] lg:px-6 "
        style={{ backgroundImage: 'url(/images/hero/map.png)' }}
      >
        <div className="container-wide relative lg:grid lg:grid-cols-[1fr_486px]">
          <div className="flex max-w-(--breakpoint-sm) flex-col pb-6 pt-11 lg:justify-center lg:pb-11">
            <h1 className="display mb-4 text-balance lg:mb-6">
              {title}
            </h1>
            <h2 className="mb-10 text-lg/[28px] font-normal text-weak lg:mb-12 lg:text-[24px]/[28px]">
              {subtitle}
            </h2>
            <div className="mb-3 lg:mb-4">
              <PhoneInput defaultCountry={defaultCountry} />
            </div>
            <Trust />
          </div>
          <Iphone locale={locale} />
        </div>
      </div>
    </section>
  );
};
