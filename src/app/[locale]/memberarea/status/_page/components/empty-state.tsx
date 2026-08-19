import { getTranslations } from 'next-intl/server';

import ToolItem from '@/components/layouts/product-layout/tool-item';
import { Icon } from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';
import { getServerSettings } from '@/settings/settings.server';

const Actions = async () => {
  const t = await getTranslations('pages.memberArea.navigation');

  const { reverseLookupEnabled: enableReverseLookup } = await getServerSettings();

  return (
    <div className="mx-auto flex max-w-[1200px] flex-wrap justify-center gap-6">
      <div className="w-full md:w-[360px]">
        <ToolItem
          icon={<Icon name="location" className="text-primary" />}
          label={t('find_by_number')}
          href={ROUTES.MEMBER.FIND_BY_NUMBER.HOME}
        />
      </div>
      <div className="w-full md:w-[360px]">
        <ToolItem
          icon={<Icon name="link" className="text-primary" />}
          label={t('find_by_link')}
          href={ROUTES.MEMBER.FIND_BY_LINK.HOME}
        />
      </div>
      {enableReverseLookup && (
        <div className="w-full md:w-[360px]">
          <ToolItem
            icon={<Icon name="phone" className="text-primary" />}
            label={t('phone_lookup')}
            href={ROUTES.REVERSE_LOOKUP.MEMBER.PHONE_LOOKUP.FORM}
          />
        </div>
      )}
      <div className="w-full md:w-[360px]">
        <ToolItem
          icon={<Icon name="handcuffs" className="text-primary" />}
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
