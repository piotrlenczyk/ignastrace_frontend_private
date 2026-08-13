export const statusFormatDate = (date: Date | string, locale: string = 'en-US'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };

  return new Intl.DateTimeFormat(locale, options)
    .format(dateObj)
    .replace(/\s*a\.\s*m\./i, ' AM')
    .replace(/\s*p\.\s*m\./i, ' PM')
    .replace(/,([^,]*)$/, ' ∙$1');
};

export const localeFormatDate = (date: Date | string, locale: string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  };

  return new Intl.DateTimeFormat(locale, options).format(dateObj).replace(/\//g, '.');
};
