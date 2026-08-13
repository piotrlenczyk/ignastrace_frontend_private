'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { RequestCounter } from '@/components/request-counter';
import { Button } from '@/components/ui/button';
import { ConsentModal } from '@/components/ui/consent-modal';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { ROUTES } from '@/constants/routes';
import { useGetUser } from '@/hooks/api/use-user';
import { useConsent } from '@/hooks/use-consent';
import { useGenericErrorToast } from '@/hooks/use-generic-error-toast';
import { useMessageErrorToast } from '@/hooks/use-message-error-toast';
import { useRouter } from '@/libs/i18n-routing';
import type { RequestCountData } from '@/types/request_count_data';

import { useCreatePhoneLocationMutation } from '../hooks/api/use-create-phone-location-mutation';
import { useSendSmsMutation } from '../hooks/api/use-send-sms-mutation';
import { createMessageSendingSchema, type MessageSendingFormValues } from '../types/message-sending.types';

export const MessageSendingForm = ({
  rawPhoneNumber,
  requestCountData,
}: {
  rawPhoneNumber: string;
  requestCountData: RequestCountData;
}) => {
  const t = useTranslations('pages.find_by_number_send_message');
  const tCommon = useTranslations('common.errors');
  const router = useRouter();
  const showErrorToast = useGenericErrorToast();
  const showErrorToastWithMessage = useMessageErrorToast();
  const { shouldShowConsent, setConsentGiven } = useConsent();
  const { data: user, error } = useGetUser();

  const [showConsentModal, setShowConsentModal] = useState(false);
  const [pendingData, setPendingData] = useState<MessageSendingFormValues | null>(null);

  const form = useForm<MessageSendingFormValues>({
    resolver: zodResolver(createMessageSendingSchema(t)),
    defaultValues: { message: '', phone: rawPhoneNumber },
  });

  const sendSmsMutation = useSendSmsMutation({
    onSuccess: () => router.push(ROUTES.MEMBER.FIND_BY_NUMBER.SUCCESS),
    onError: (error) => {
      switch (error.status) {
        case 429:
          showErrorToastWithMessage(tCommon('rate_limit_error'), tCommon('rate_limit_error_title'));
          break;
        default:
          showErrorToast();
          break;
      }
    },
  });

  const createPhoneLocationMutation = useCreatePhoneLocationMutation({
    onSuccess: (data) => {
      sendSmsMutation.mutate(data.id);
    },
    onError: (error) => {
      switch (error.status) {
        case 429:
          showErrorToastWithMessage(tCommon('rate_limit_error'), tCommon('rate_limit_error_title'));
          break;
        default:
          showErrorToast();
          break;
      }
    },
  });

  const handleSubmit = (data: MessageSendingFormValues) => {
    // Check if consent is needed for US users (only for anonymous users)
    // If there's an error getting user data, assume user is not authenticated
    const isAuthenticated = user && !error;
    if (shouldShowConsent && !isAuthenticated) {
      setPendingData(data);
      setShowConsentModal(true);
      return;
    }

    // For non-US users, logged-in users, or when consent is already given, proceed directly
    createPhoneLocationMutation.mutate(data);
  };

  const handleConsentAccept = () => {
    setConsentGiven(true);
    setShowConsentModal(false);
    if (pendingData) {
      createPhoneLocationMutation.mutate(pendingData);
    }
  };

  const handleConsentDecline = () => {
    setShowConsentModal(false);
    setPendingData(null);
  };

  const isPending = createPhoneLocationMutation.isPending || sendSmsMutation.isPending;

  return (
    <>
      {showConsentModal && <ConsentModal onAccept={handleConsentAccept} onDecline={handleConsentDecline} />}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4">
          <FormField control={form.control} name="phone" render={({ field }) => <input type="hidden" {...field} />} />

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between gap-2">
                  <FormLabel>{t('label')}</FormLabel>
                  <RequestCounter requestCountData={requestCountData} />
                </div>
                <FormControl>
                  <Textarea placeholder={t('placeholder')} className="min-h-40" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" size="lg" className="mt-2" disabled={isPending}>
            {t('CTA')}
          </Button>
        </form>
      </Form>
    </>
  );
};
