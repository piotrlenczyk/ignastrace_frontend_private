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
import pl from 'react-phone-number-input/locale/pl';
import pt from 'react-phone-number-input/locale/pt';
import sk from 'react-phone-number-input/locale/sk';
import sv from 'react-phone-number-input/locale/sv';
import th from 'react-phone-number-input/locale/th';
import tr from 'react-phone-number-input/locale/tr';
import ua from 'react-phone-number-input/locale/ua';
import vi from 'react-phone-number-input/locale/vi';
import da from 'src/locales/react-phone-number-input-mb/locale/da.json';
import id from 'src/locales/react-phone-number-input-mb/locale/id.json';
import ms from 'src/locales/react-phone-number-input-mb/locale/ms.json';
import ro from 'src/locales/react-phone-number-input-mb/locale/ro.json';

import { getFunnelPhone } from '@/actions/funnel-phone-number';
import FunnelLayout from '@/components/layouts/funnel-layout';
import { FALLBACK_COUNTRY } from '@/constants/countries';
import { ROUTES } from '@/constants/routes';
import { formatPhoneNumber } from '@/hooks/format-phone-number';
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

  if (!phoneNumber || !formattedNumber.valid) {
    redirect(ROUTES.REVERSE_LOOKUP.HOME);
  }

  const countryName = labels[formattedNumber.country as keyof typeof labels || FALLBACK_COUNTRY];

  return (
    <FunnelLayout isReverseLookup>
      <Loader
        rawPhone={phoneNumber}
        phoneNumber={formattedNumber.number}
        countryName={countryName}
      />
    </FunnelLayout>
  );
};

export default LoaderPage;
