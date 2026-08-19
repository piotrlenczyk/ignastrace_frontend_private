import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { Icon } from '@/components/ui/icon';

/**
 * The security reassurance every screen that takes a payment puts under the
 * form.
 *
 * It is legacy markup on legacy `pages.checkout` keys, extracted rather than
 * written: the three screens taking a payment each carried their own copy, one
 * of them inside the payment form itself, and the form is being deleted. Pulling
 * the block out is what stops its removal quietly costing two screens a row they
 * have always shown. It is re-keyed and redesigned with the screens that render
 * it, not before.
 */
export const PaymentTrustRow = () => {
  const t = useTranslations('pages.checkout');

  return (
    <div className="mt-4 mb-6 flex items-center justify-between gap-5 text-xs text-weak">
      <div className="flex items-center gap-2">
        <Icon name="safe" className="text-2xl" />
        <span>{t('trust_100')}</span>
      </div>
      <Image
        src="/images/norton.jpg"
        width="100"
        height="28"
        className="h-[23px] w-[82px] lg:h-[28px] lg:w-[100px]"
        alt="Norton Secured powered by VeriSign"
      />
    </div>
  );
};
