'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ROUTES } from '@/constants/routes';
import { useGenericErrorToast } from '@/hooks/use-generic-error-toast';
import { useRouter } from '@/libs/i18n-routing';
import { cn } from '@/libs/utils';

import { useCreateLinkLocationMutation } from './hooks/api/use-create-link-location-mutation';
import { type CreateLinkFormValues, createLinkLocationSchema } from './types/create-link.types';

export const CreateCustomLinkForm = ({ className }: { className?: string }) => {
  const t = useTranslations('pages.find_by_link.form');
  const router = useRouter();
  const showErrorToast = useGenericErrorToast();

  const form = useForm<CreateLinkFormValues>({
    resolver: zodResolver(createLinkLocationSchema(t)),
    defaultValues: {
      name: '',
    },
  });

  const { mutate, isPending } = useCreateLinkLocationMutation({
    onSuccess: (data) => {
      router.push(`${ROUTES.MEMBER.FIND_BY_LINK.SUCCESS}?id=${data.id}`);
    },
    onError: () => {
      showErrorToast();
    },
  });

  const handleSubmit = (data: CreateLinkFormValues) => {
    mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={cn('space-y-3', className)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('linkLabel')}
              </FormLabel>
              <div className="input-animated-border rounded-lg">
                <FormControl>
                  <Input className="phone-input-input h-14 border-0" placeholder={t('linkPlaceholder')} {...field} />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" size="lg" className="w-full" disabled={isPending}>
          {t('submitButton')}
        </Button>
      </form>
    </Form>
  );
};
