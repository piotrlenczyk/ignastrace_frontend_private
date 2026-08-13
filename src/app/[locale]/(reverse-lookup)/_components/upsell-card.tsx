'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

import { Card } from '@/components/homepage/card';
import LimitedOfferTag from '@/components/reverse-lookup/limited-offer-tag';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { createPriceFormatter } from '@/hooks/cldr-price-formatter';
import { useApi } from '@/hooks/use-api';
import { useMessageErrorToast } from '@/hooks/use-message-error-toast';
import { useCountry } from '@/hooks/useCountry';
import type { User } from '@/types/user';

import { useUpsellingMutation } from '../../success/_hooks/api/use-upselling-mutation';
import type { Product } from '../../success/_types/product.type';

type UpsellCardProps = {
  title: string;
  specialOfferText: string;
  upsellBenefits: {
    title: string;
    icon: React.ReactNode;
  }[];
  redirectUrl: string;
  iconUrl: string;
  purchaseButtonText: string;
  product: Product;
};

const UpsellCard = ({
  title,
  specialOfferText,
  upsellBenefits,
  redirectUrl,
  iconUrl,
  purchaseButtonText,
  product,
}: UpsellCardProps) => {
  const t = useTranslations('pages.reverse_lookup.upsell');
  const tStripeForm = useTranslations('components.forms.stripe_form');

  const api = useApi();
  const router = useRouter();
  const locale = useLocale();
  const country = useCountry();
  const formatPrice = createPriceFormatter();
  const showErrorToast = useMessageErrorToast();

  const [isPurchased, setIsPurchased] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);

  const { mutate: createUpselling, isPending } = useUpsellingMutation({
    onSuccess: () => {
      router.push(redirectUrl);
    },
    onError: () => {
      console.error('Error creating upselling');
      setIsSubmitted(false);
      showErrorToast(tStripeForm('errors.stripe_generic_error'), tStripeForm('errors.stripe_generic_error_title'));
    },
  });

  const getButtonContent = () => {
    if (isPurchased) {
      return t('already_purchased');
    }
    if (isPending || isSubmitted) {
      return (
        <span className="flex items-center gap-1">
          {t('processing')}
          <Icon name="reload" className="size-4 animate-spin" />
        </span>
      );
    }
    return purchaseButtonText;
  };

  const handlePurchaseUpsell = async () => {
    setIsSubmitted(true);

    try {
      const user = await api.get<User>('/user?expand=purchase_info');
      if (user.upsellings.includes(product.key)) {
        setIsPurchased(true);
        setIsSubmitted(false);
        return;
      }
    } catch (error) {
      console.error('Error checking user purchase info', error);
      setIsSubmitted(false);
    }
    createUpselling([product.key]);
  };

  const handleSkip = () => {
    setIsSkipped(true);
    router.push(redirectUrl);
  };

  return (
    <Card className="border border-stroke-weak px-4 py-6 shadow-raised lg:p-8">
      <div className="flex flex-col gap-5">
        <div className="flex justify-between">
          <h3 className="max-w-[180px] h3 font-bold lg:max-w-[345px]">{title}</h3>
          <Image src={iconUrl} alt={`${title} icon`} width={63} height={72} />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold lg:text-2xl">{t('total_due_today')}</h4>
              <div className="flex flex-col">
                <span className="h4 text-right font-bold">
                  {formatPrice(product.price, product.currency, country, locale)}
                </span>
              </div>
            </div>
            <LimitedOfferTag className="mx-auto" />
          </div>
          <Button
            className="font-semibold lg:hidden"
            onClick={handlePurchaseUpsell}
            disabled={isPending || isPurchased || isSubmitted}
          >
            {getButtonContent()}
          </Button>
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4">
              <Icon name="discount" className="size-6" />
              <span className="lg:text-base">{specialOfferText}</span>
            </div>
            {upsellBenefits.map((benefit) => (
              <div key={benefit.title} className="flex gap-[6px]">
                {benefit.icon}
                <span className="text-lg">{benefit.title}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-4">
          <Button
            variant="ghost"
            className={`
              flex-1 border border-stroke-weak font-semibold text-weak
              hover:text-weak
              lg:max-w-[120px] lg:shrink-0 lg:text-lg
            `}
            onClick={handleSkip}
            disabled={isSubmitted || isSkipped}
          >
            {t('skip')}
          </Button>
          <Button
            className="hidden font-semibold lg:flex lg:flex-1 lg:text-lg"
            onClick={handlePurchaseUpsell}
            disabled={isPending || isPurchased || isSubmitted || isSkipped}
          >
            {getButtonContent()}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default UpsellCard;
