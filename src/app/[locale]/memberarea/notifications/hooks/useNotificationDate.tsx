import { useFormatter } from 'next-intl';

/**
 * When a notification arrived, read the way the screen has always read it: a
 * relative time for the last seven days, a date before that.
 *
 * It takes the timestamp as the API states it — an ISO string — rather than a
 * shape of its own, so the row model carries the arrival time through unparsed.
 */
export const useNotificationDate = (createdAt: string) => {
  const format = useFormatter();

  const arrivedAt = new Date(createdAt);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const date =
    arrivedAt > sevenDaysAgo
      ? format.relativeTime(arrivedAt)
      : format.dateTime(arrivedAt, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

  return {
    date,
  };
};
