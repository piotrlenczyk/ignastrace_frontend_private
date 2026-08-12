import { useInfiniteQuery } from '@tanstack/react-query';

import { useApi } from '@/hooks/use-api';
import type { ApiError } from '@/libs/api-error';
import type { Notification } from '@/types/notification';

type NotificationFromApi = Omit<Notification, 'created_at'> & {
  created_at: string;
};

type ApiResponse = {
  notifications: NotificationFromApi[];
  has_more: boolean;
};

export type NotificationsApiResponse = {
  notifications: Notification[];
  has_more: boolean;
};

export type NotificationsQueryResult = {
  pages: NotificationsApiResponse[];
  pageParams: unknown[];
  notifications: Notification[];
  has_more: boolean;
};

function transformNotification(notification: NotificationFromApi): Notification {
  return {
    ...notification,
    created_at: new Date(notification.created_at),
  };
}

export function useNotificationsQuery() {
  const api = useApi();

  return useInfiniteQuery<NotificationsApiResponse, ApiError, NotificationsQueryResult>({
    queryKey: ['notifications'],
    queryFn: async ({ pageParam = '' }) => {
      const url = pageParam ? `/notifications?after=${pageParam}` : '/notifications';
      const response = await api.get<ApiResponse>(url);
      return {
        ...response,
        notifications: response.notifications.map(transformNotification),
      };
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.has_more) {
        return '';
      }
      const lastNotification = lastPage.notifications[lastPage.notifications.length - 1];
      return lastNotification?.id;
    },
    select: (data): NotificationsQueryResult => ({
      ...data,
      notifications: data.pages.flatMap(page => page.notifications),
      has_more: data.pages[data.pages.length - 1]?.has_more ?? false,
    }),
    initialPageParam: '',
    gcTime: 0,
  });
}
