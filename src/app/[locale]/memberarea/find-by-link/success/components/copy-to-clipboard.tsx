'use client';

import { useTranslations } from 'next-intl';

import { IconCopyLine } from '@/components/ui/icon/icons/CopyLine';
import { useToast } from '@/hooks/use-toast';

export const CopyToClipBoard = ({ content }: { content: string }) => {
  const { toast } = useToast();
  const t = useTranslations('common');

  const handleClick = () => {
    navigator.clipboard.writeText(content);

    toast({
      description: t('copied_to_clipboard'),
    });
  };

  return (
    <button type="button" onClick={handleClick} className="brand-icon">
      <IconCopyLine size="large" />
    </button>
  );
};
