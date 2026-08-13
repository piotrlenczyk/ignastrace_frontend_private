import type { CountryCode } from 'libphonenumber-js';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { Icon } from '@/components/ui/icon';

import { LookupForm } from './lookup-form';

/*
 * Hero for the rebuilt reverse-lookup landing page
 * (13002:131640 desktop, top of 13002:156326 mobile).
 *
 * The right-hand visual is a single exported PNG rather than markup. In Figma it is
 * a ~40-node composition — a blurred street photo, a phone mockup overflowing its
 * frame, three floating result cards and four social glyphs — and the project
 * already ships hero art this way (`/images/reverse-lookup/phone/iphone_*.png`).
 * Note the phone screen has English copy baked in, so a localised hero needs a
 * per-locale export the way the legacy one had.
 */

const benefits = ['identity', 'photos', 'privacy'] as const;

export const Hero = ({ defaultCountry }: { defaultCountry: CountryCode }) => {
  const t = useTranslations('__NEW__.reverse_lookup.hero');

  return (
    <section className="bg-bg-primary">
      <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[5fr_7fr]">
        {/* Text column — centred on mobile, left-aligned and divided at lg */}
        <div
          className={`
            flex flex-col items-center gap-8 px-4 pt-10 pb-8 text-center
            lg:items-start lg:gap-12 lg:border-r lg:border-border-secondary-alt lg:py-24 lg:pr-12 lg:pl-8 lg:text-left
          `}
        >
          <div className="flex flex-col gap-4">
            <h1 className="font-display text-display-sm-medium text-text-primary lg:text-display-xl-medium">
              {t('title')}
            </h1>
            <p className="max-w-[560px] font-body text-md-regular text-text-tertiary lg:text-lg-regular">
              {t('subtitle')}
            </p>
          </div>

          <div className="flex w-full flex-col gap-4">
            <LookupForm defaultCountry={defaultCountry} />

            <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start lg:pl-1.5">
              {/*
               * The rating is desktop-only: the mobile frame drops it and starts the
               * trust row at "Trusted by".
               */}
              <div className="hidden items-center gap-2 lg:flex">
                <span className="font-body text-sm-medium text-text-primary">{t('rating')}</span>
                <Icon name="star" className="size-5" aria-label={t('rating_label')} />
              </div>
              <span className="hidden h-2 w-px bg-alpha-black-30 lg:block" aria-hidden />

              <p className="font-body text-sm-regular text-text-primary">
                {t.rich('trusted_by', {
                  strong: (chunks) => <span className="text-sm-semibold">{chunks}</span>,
                })}
              </p>
              <span className="h-2 w-px bg-alpha-black-30" aria-hidden />
              <p className="font-body text-sm-regular text-text-primary">{t('confidential')}</p>
            </div>
          </div>

          <ul className="flex w-full flex-col gap-4 text-left">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3">
                <Icon name="check-circle" className="mt-0.5 size-6 shrink-0 text-fg-quaternary" />
                <span className="font-body text-md-regular text-text-primary">{t(`benefits.${benefit}`)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Visual column */}
        <div className="relative min-h-[320px] overflow-hidden lg:min-h-[960px]">
          <Image
            src="/images/reverse-lookup/hero/hero-visual.png"
            alt={t('image_alt')}
            fill
            priority
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="object-cover object-top"
          />
        </div>
      </div>
    </section>
  );
};
