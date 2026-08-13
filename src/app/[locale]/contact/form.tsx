'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useGenericErrorToast } from '@/hooks/use-generic-error-toast';
import { useToast } from '@/hooks/use-toast';

import { useContactUsMutation } from './hooks/contact-us-mutation';
import { contactUsCreateSchema, type ContactUsFormValues } from './types/contact-form.types';

export const ContactForm = ({
  className,
  variant = 'default',
}: {
  className?: string;
  variant?: 'default' | 'brand';
}) => {
  const t = useTranslations('pages.contact.form');
  const locale = useLocale();
  const { toast } = useToast();
  const showErrorToast = useGenericErrorToast();

  const form = useForm<ContactUsFormValues>({
    resolver: zodResolver(contactUsCreateSchema(t)),
    defaultValues: {
      name: '',
      surname: '',
      email: '',
      subject: '',
      message: '',
      locale,
    },
    mode: 'onChange', // Activates validation while the user types
  });

  const { mutate, isPending } = useContactUsMutation({
    onSuccess: () => {
      form.reset();
      toast({
        title: t('submitted_title'),
        description: t('submitted'),
        variant: 'success',
      });
    },
    onError: () => {
      showErrorToast();
    },
  });

  const handleSubmit = (data: ContactUsFormValues) => {
    mutate(data);
  };

  const {
    formState: { isValid, isDirty },
  } = form;

  return (
    <div className={className}>
      <h1 className="h4 mb-4 font-bold">{t('title')}</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('name_label')} *</FormLabel>
                  <div className="rounded-md">
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="surname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('surname_label')} *</FormLabel>
                  <div className="rounded-md">
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('email_label')} *</FormLabel>
                  <div className="rounded-md">
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('subject_label')} *</FormLabel>
                  <div className="rounded-md">
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-[50px] bg-white p-3 text-base">
                          <SelectValue placeholder={t('subject_placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="billing_question">{t('billing_question')}</SelectItem>
                          <SelectItem value="technical_issue">{t('technical_issue')}</SelectItem>
                          <SelectItem value="suggested_improvement">{t('suggested_improvement')}</SelectItem>
                          <SelectItem value="other">{t('other')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('message_label')} *</FormLabel>
                <div className="rounded-md">
                  <FormControl>
                    <Textarea {...field} rows={7} />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            size="lg"
            className="min-w-full"
            variant={variant}
            disabled={isPending || !isValid || !isDirty}
          >
            {t('submit')}
          </Button>
        </form>
      </Form>
    </div>
  );
};
