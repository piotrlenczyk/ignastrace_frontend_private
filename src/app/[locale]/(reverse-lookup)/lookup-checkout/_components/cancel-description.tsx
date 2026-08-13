import { useTranslations } from 'next-intl';

export const CancelDescription = () => {
  const t = useTranslations('pages.reverse_lookup.checkout');

  return (
    <p>
      {t.rich('cancel_description', {
        email: (chunks) => (
          <a href={`mailto:${chunks}`} className="link">
            {chunks}
          </a>
        ),
      })}
    </p>
  );
};
