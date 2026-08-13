import { getTranslations } from 'next-intl/server';

import ToolItem from '@/components/layouts/product-layout/tool-item';
import { IconLinkAlt01 } from '@/components/ui/icon/icons';
import { IconSexOffender } from '@/components/ui/icon/icons/IconSexOffender';
import { IconLocationMy } from '@/components/ui/icon/icons/LocationMy';
import { IconPhoneLine } from '@/components/ui/icon/icons/PhoneLine';
import { ROUTES } from '@/constants/routes';
import { getFeatures } from '@/libs/server/feature-flags';

const Actions = async () => {
  const t = await getTranslations('pages.memberArea.navigation');

  const { ENABLE_REVERSE_LOOKUP: enableReverseLookup } = await getFeatures();

  return (
    <div className="mx-auto flex max-w-[1200px] flex-wrap justify-center gap-6">
      <div className="w-full md:w-[360px]">
        <ToolItem
          icon={<IconLocationMy size="large" className="text-primary" />}
          label={t('find_by_number')}
          href={ROUTES.MEMBER.FIND_BY_NUMBER.HOME}
        />
      </div>
      <div className="w-full md:w-[360px]">
        <ToolItem
          icon={<IconLinkAlt01 size="large" className="text-primary" />}
          label={t('find_by_link')}
          href={ROUTES.MEMBER.FIND_BY_LINK.HOME}
        />
      </div>
      {enableReverseLookup && (
        <div className="w-full md:w-[360px]">
          <ToolItem
            icon={<IconPhoneLine size="large" className="text-primary" />}
            label={t('phone_lookup')}
            href={ROUTES.REVERSE_LOOKUP.MEMBER.PHONE_LOOKUP.FORM}
          />
        </div>
      )}
      <div className="w-full md:w-[360px]">
        <ToolItem
          icon={<IconSexOffender size="large" className="text-primary" />}
          label={t('sex_offenders_search')}
          href={ROUTES.MEMBER.SEX_OFFENDERS_SEARCH.HOME}
        />
      </div>
    </div>
  );
};

export const EmptyState = async () => {
  const t = await getTranslations('pages.status');

  return (
    <div className="py-10 lg:min-w-[640px]">
      <div className="globe mb-4">
        <div className="globe-map"></div>
      </div>
      <div className="flex flex-col gap-6 py-8 text-center">
        <h4 className="h4 font-bold">{t('no_locations_available')}</h4>
        <Actions />
      </div>
    </div>
  );
};
