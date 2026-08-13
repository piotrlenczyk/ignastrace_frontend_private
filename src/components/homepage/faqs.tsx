import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getFeatures } from '@/libs/server/feature-flags';
import { cn } from '@/libs/utils';

type Question = {
  id: string;
  question: any;
  answer: any;
};

const content: Question[] = [
  { id: 'q1', question: 'question_1.question', answer: 'question_1.answer' },
  { id: 'q2', question: 'question_2.question', answer: 'question_2.answer' },
  { id: 'q3', question: 'question_3.question', answer: 'question_3.answer' },
  { id: 'q4', question: 'question_4.question', answer: 'question_4.answer' },
  { id: 'q5', question: 'question_5.question', answer: 'question_5.answer' },
  { id: 'q6', question: 'question_6.question', answer: 'question_6.answer' },
  { id: 'q7', question: 'question_7.question', answer: 'question_7.answer' },
  { id: 'q8', question: 'question_8.question', answer: 'question_8.answer' },
  { id: 'q9', question: 'question_9.question', answer: 'question_9.answer' },
];

const Title = async ({ className, variant = 'section' }: { className?: string; variant?: 'section' | 'inline ' }) => {
  const t = await getTranslations('pages.index.faqs');

  const css = variant === 'section' ? 'mb-8 text-center lg:mb-14' : 'h4 font-bold';

  return <h2 className={cn(css, className)}>{t('title')}</h2>;
};

const Content = async ({ className }: { className?: string }) => {
  const t = await getTranslations('pages.index.faqs');
  const { ENABLE_REVERSE_LOOKUP } = await getFeatures();
  const faqs = !ENABLE_REVERSE_LOOKUP ? content.filter(({ id }) => id !== 'q7' && id !== 'q8' && id !== 'q9') : content;

  return (
    <Accordion
      type="single"
      collapsible
      className={cn('mx-auto flex w-full max-w-[960px] flex-col items-stretch', className)}
    >
      {faqs.map(({ id, question, answer }: Question) => {
        return (
          <AccordionItem value={id} key={id}>
            <AccordionTrigger className="gap-4 py-4 text-left text-lg text-strong lg:py-5">
              {t(question)}
            </AccordionTrigger>
            <AccordionContent>{t(answer)}</AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};

const FAQs = ({ children, className, id }: { children: ReactNode; className?: string; id?: string }) => {
  return (
    <section className={className} id={id}>
      {children}
    </section>
  );
};

FAQs.Title = Title;
FAQs.Content = Content;

export { FAQs };
