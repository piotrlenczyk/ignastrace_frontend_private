'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { IconLoaderCircle } from '@/components/ui/icon/icons';
import { ROUTES } from '@/constants/routes';
import { useMessageErrorToast } from '@/hooks/use-message-error-toast';
import { useRouter } from '@/libs/i18n-routing';

import { useSendOrderConfirmEmailMutation } from '../_hooks/api/use-send-order-confirm-email-mutation';
import { useUpsellingMutation } from '../_hooks/api/use-upselling-mutation';
import type { Product } from '../_types/product.type';
import { OrderDetails } from './order-details';
import { ProductCards } from './product-cards';

const UpsellPageClient = ({ products }: { products: Product[] }) => {
  const t = useTranslations('pages.upsell');
  const tStripeForm = useTranslations('components.forms.stripe_form');
  const router = useRouter();

  const [addedProducts, setAddedProducts] = useState<Product[]>(products);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showErrorToast = useMessageErrorToast();

  const addProduct = (product: Product) => {
    setAddedProducts(prevProducts => [...prevProducts, product]);
  };

  const removeProduct = (productId: string) => {
    setAddedProducts(prevProducts => prevProducts.filter(product => product.key !== productId));
  };

  const { mutate: createUpselling, isPending: isCreatingUpselling } = useUpsellingMutation({
    onSuccess: () => {
      router.push(ROUTES.THANK_YOU);
      setIsSubmitted(true);
    },
    onError: () => {
      console.error('Error creating upselling');

      setIsSubmitted(false);
      setIsSubmitting(false);
      showErrorToast(
        tStripeForm('errors.stripe_generic_error'),
        tStripeForm('errors.stripe_generic_error_title'),
      );
    },
  });

  const { mutate: sendOrderConfirmEmail } = useSendOrderConfirmEmailMutation({
    onSuccess: () => {
      router.push(ROUTES.THANK_YOU);
    },
    onError: () => {
      router.push(ROUTES.THANK_YOU);
    },
  });

  const handleSubmit = () => {
    setIsSubmitting(true);
    try {
      const productKeys = addedProducts.map(product => product.key);
      createUpselling(productKeys);
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="s-main bg-alternate py-6">
        <div className="container-content px-6 md:px-0">
          <h1 className="mb-3 h3 font-bold">{t('title')}</h1>
          <p className="mb-6 text-strong">{t('description')}</p>
        </div>
        <ProductCards
          products={products}
          addedProducts={addedProducts}
          onAddProduct={addProduct}
        />

        <OrderDetails
          products={products}
          addedProducts={addedProducts}
          onAddProduct={addProduct}
          onRemoveProduct={removeProduct}
          className="px-6 md:px-0"
        />

      </div>
      <div className="sticky bottom-0 bg-base-blur p-6 backdrop-blur-xl md:px-0">
        <div className="container-content flex flex-col gap-4">
          <Button size="lg" onClick={handleSubmit} disabled={isCreatingUpselling || isSubmitted}>
            {t('submit_button')}
            { isSubmitting ? (<IconLoaderCircle size="large" className="animate-spin" />) : ''}
          </Button>
          <Button
            variant="ghost"
            className="mx-auto text-base font-normal text-weak underline underline-offset-2"
            onClick={() => sendOrderConfirmEmail()}
            disabled={isCreatingUpselling || isSubmitted}
          >
            {t('cancel_button')}
          </Button>
        </div>
      </div>
    </>
  );
};

export default UpsellPageClient;
