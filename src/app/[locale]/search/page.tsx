import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import de from 'react-phone-number-input/locale/de';
import el from 'react-phone-number-input/locale/el';
import en from 'react-phone-number-input/locale/en';
import es from 'react-phone-number-input/locale/es';
import fr from 'react-phone-number-input/locale/fr';
import it from 'react-phone-number-input/locale/it';
import ko from 'react-phone-number-input/locale/ko';
import nb from 'react-phone-number-input/locale/nb';
import nl from 'react-phone-number-input/locale/nl';
import pt from 'react-phone-number-input/locale/pt';
import sk from 'react-phone-number-input/locale/sk';
import sv from 'react-phone-number-input/locale/sv';
import th from 'react-phone-number-input/locale/th';
import tr from 'react-phone-number-input/locale/tr';
import da from 'src/locales/react-phone-number-input-mb/locale/da.json';
import id from 'src/locales/react-phone-number-input-mb/locale/id.json';
import ms from 'src/locales/react-phone-number-input-mb/locale/ms.json';
import pl from 'src/locales/react-phone-number-input-mb/locale/pl.json';
import ro from 'src/locales/react-phone-number-input-mb/locale/ro.json';
import ua from 'src/locales/react-phone-number-input-mb/locale/ua.json';
import vi from 'src/locales/react-phone-number-input-mb/locale/vi.json';

import { getFunnelPhone } from '@/actions/funnel-phone-number';
import FunnelLayout from '@/components/layouts/funnel-layout';
import { FALLBACK_COUNTRY } from '@/constants/countries';
import { ROUTES } from '@/constants/routes';
import { formatPhoneNumber } from '@/hooks/format-phone-number';
import { getSubscriptionRedirect } from '@/libs/subscription';
import { LanguageLocale } from '@/utils/config';

import { Loader } from './components/loader';

const localeMap = {
  [LanguageLocale.Spanish.code]: es,
  [LanguageLocale.English.code]: en,
  [LanguageLocale.Portuguese.code]: pt,
  [LanguageLocale.French.code]: fr,
  [LanguageLocale.Deutsch.code]: de,
  [LanguageLocale.Italian.code]: it,
  [LanguageLocale.Dutch.code]: nl,
  [LanguageLocale.Norwegian.code]: nb,
  [LanguageLocale.Polish.code]: pl,
  [LanguageLocale.Swedish.code]: sv,
  [LanguageLocale.Turkish.code]: tr,
  [LanguageLocale.Romanian.code]: ro,
  [LanguageLocale.Danish.code]: da,
  [LanguageLocale.Thai.code]: th,
  [LanguageLocale.Korean.code]: ko,
  [LanguageLocale.Ukrainian.code]: ua,
  [LanguageLocale.Vietnamese.code]: vi,
  [LanguageLocale.Malaysian.code]: ms,
  [LanguageLocale.Indonesian.code]: id,
  [LanguageLocale.Czech.code]: en,
  [LanguageLocale.Croatian.code]: en,
  [LanguageLocale.Greek.code]: el,
  [LanguageLocale.Slovak.code]: sk,
};
const LoaderPage = async () => {
  const locale = await getLocale();

  const labels = localeMap[locale as keyof typeof localeMap] ?? en;

  const phoneNumber = await getFunnelPhone();
  const formattedNumber = formatPhoneNumber(phoneNumber);

  const redirectUrl = await getSubscriptionRedirect({
    routes: {
      activeSubscription: phoneNumber
        ? ROUTES.MEMBER.FIND_BY_NUMBER.MESSAGE_SENDING
        : ROUTES.MEMBER.FIND_BY_NUMBER.HOME,
      endedSubscription: ROUTES.MEMBER.SETTINGS.BILLING,
    },
  });

  if (redirectUrl) {
    redirect(redirectUrl);
  }

  if (!phoneNumber || !formattedNumber.valid) {
    redirect(ROUTES.HOME);
  }

  const countryName = labels[(formattedNumber.country as keyof typeof labels) || FALLBACK_COUNTRY];

  return (
    <FunnelLayout>
      <Loader rawPhone={phoneNumber} phoneNumber={formattedNumber.number} countryName={countryName} />
    </FunnelLayout>
  );
};

export default LoaderPage;
