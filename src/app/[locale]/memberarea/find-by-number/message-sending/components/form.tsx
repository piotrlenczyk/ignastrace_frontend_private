'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { RequestCounter } from '@/components/request-counter';
import { Button } from '@/components/ui/button';
import { ConsentModal } from '@/components/ui/consent-modal';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useConsent } from '@/hooks/use-consent';
import { useGenericErrorToast } from '@/hooks/use-generic-error-toast';
import { useMessageErrorToast } from '@/hooks/use-message-error-toast';
import { useSession } from '@/hooks/use-session';
import { actionCreateNumberLocationRequest } from '@/server/actions/location-request.actions';
import { isDispatchLimitActionError } from '@/server/lib/location-request-action-error';
import type { RequestCountData } from '@/types/request_count_data';

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
  const showErrorToast = useGenericErrorToast();
  const showErrorToastWithMessage = useMessageErrorToast();
  const { shouldShowConsent, setConsentGiven } = useConsent();
  const { isSignedIn } = useSession();

  const [showConsentModal, setShowConsentModal] = useState(false);
  const [pendingData, setPendingData] = useState<MessageSendingFormValues | null>(null);

  const form = useForm<MessageSendingFormValues>({
    resolver: zodResolver(createMessageSendingSchema(t)),
    defaultValues: { message: '', phone: rawPhoneNumber },
  });

  /*
   * One action creates the Location request and dispatches its SMS, and it navigates
   * on success — so there is no success branch here, only the two things a refusal
   * can be. The dispatch limit is the one a member can act on, so it gets its own
   * message; everything else is the generic one.
   *
   * Only dispatch is limited: creating a Location request costs nothing against the
   * SMS dispatch cycle, so there is no second place this branch has to be made.
   */
  const { execute, isPending } = useAction(actionCreateNumberLocationRequest, {
    onError: ({ error }) => {
      if (isDispatchLimitActionError(error.serverError)) {
        showErrorToastWithMessage(tCommon('rate_limit_error'), tCommon('rate_limit_error_title'));
      } else {
        showErrorToast();
      }
    },
  });

  const askByNumber = ({ phone, message }: MessageSendingFormValues) => {
    execute({ phoneNumber: phone, message });
  };

  const handleSubmit = (data: MessageSendingFormValues) => {
    // Check if consent is needed for US users (only for anonymous users).
    // The sealed session is what says who is signed in, so the answer is here
    // before the first paint rather than after a round trip that could fail.
    if (shouldShowConsent && !isSignedIn) {
      setPendingData(data);
      setShowConsentModal(true);
      return;
    }

    // For non-US users, logged-in users, or when consent is already given, proceed directly
    askByNumber(data);
  };

  const handleConsentAccept = () => {
    setConsentGiven(true);
    setShowConsentModal(false);
    if (pendingData) {
      askByNumber(pendingData);
    }
  };

  const handleConsentDecline = () => {
    setShowConsentModal(false);
    setPendingData(null);
  };

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
