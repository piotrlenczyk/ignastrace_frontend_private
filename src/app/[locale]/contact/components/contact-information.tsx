import { useTranslations } from 'next-intl';

import { IconEmailLine } from '@/components/ui/icon/icons/EmailLine';
import { IconEnterpriseLine } from '@/components/ui/icon/icons/EnterpriseLine';
import { IconPhone2Line } from '@/components/ui/icon/icons/Phone2Line';

const items = [
  {
    id: '1',
    icon: IconEmailLine,
    title: 'contact_information.email_title',
    description: 'contact_information.email_description',
  },
  {
    id: '2',
    icon: IconPhone2Line,
    title: 'contact_information.phone_title',
    description: 'contact_information.phone_description',
  },
  {
    id: '3',
    icon: IconEnterpriseLine,
    title: 'contact_information.company_title',
    description: 'contact_information.company_description',
  },
];

export const ContactInformation = () => {
  const t = useTranslations('pages.contact');

  return (
    <dl className="flex flex-col gap-6">
      {items.map((item) => (
        <div key={item.id} className="flex gap-2">
          <item.icon size="large" className="text-secondary" />
          <div>
            <dt className="font-semibold">{t(item.title as any)}</dt>
            <dd dangerouslySetInnerHTML={{ __html: t.raw(item.description as any) }} />
          </div>
        </div>
      ))}
    </dl>
  );
};
