'use client';

import { useCallback, useMemo, useState } from 'react';
import clsx from 'clsx';
import {
  BellIcon,
  CheckIcon,
  TruckIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  CogIcon,
  ShieldExclamationIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import {
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import type { NotificationData, NotificationType } from '@shopvui/shared';
import { useAuth } from '../../../contexts/AuthContext';
import { Footer } from '../../../components/layout/footer';
import * as notificationsApi from '../../../lib/api/notifications';

const TYPE_CONFIG: Record<
  NotificationType,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  ORDER_STATUS: { label: 'Orders', icon: TruckIcon, color: 'text-blue-600 dark:text-blue-400' },
  PAYMENT: { label: 'Payments', icon: CreditCardIcon, color: 'text-green-600 dark:text-green-400' },
  COMMISSION: { label: 'Commissions', icon: CurrencyDollarIcon, color: 'text-amber-600 dark:text-amber-400' },
  SYSTEM: { label: 'System', icon: CogIcon, color: 'text-neutral-600 dark:text-neutral-400' },
  ADMIN_ALERT: { label: 'Admin', icon: ShieldExclamationIcon, color: 'text-red-600 dark:text-red-400' },
  RESELLER: { label: 'Reseller', icon: UserGroupIcon, color: 'text-purple-600 dark:text-purple-400' },
  CONVERSATION: { label: 'Conversations', icon: ChatBubbleLeftRightIcon, color: 'text-indigo-600 dark:text-indigo-400' },
};

const TYPE_ORDER: NotificationType[] = [
  'CONVERSATION',
  'ORDER_STATUS',
  'PAYMENT',
  'COMMISSION',
  'SYSTEM',
  'ADMIN_ALERT',
  'RESELLER',
];

export default function NotificationsPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<NotificationType | 'ALL'>('ALL');

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['notifications', 'list'],
    queryFn: ({ pageParam }) =>
      notificationsApi.fetchNotifications(token!, pageParam, 100),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    enabled: !!token,
  });

  const allNotifications = data?.pages.flatMap((p) => p.data) ?? [];

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }, [queryClient]);

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(token!, id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications', 'list'] });
      queryClient.setQueryData(['notifications', 'list'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.map((n: NotificationData) =>
              n.id === id ? { ...n, isRead: true } : n,
            ),
          })),
        };
      });
    },
    onSettled: invalidate,
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(token!),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications', 'list'] });
      queryClient.setQueryData(['notifications', 'list'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.map((n: NotificationData) => ({
              ...n,
              isRead: true,
            })),
          })),
        };
      });
    },
    onSettled: invalidate,
  });

  const typeCounts = useMemo(() => {
    const counts: Partial<Record<NotificationType, number>> = {};
    for (const n of allNotifications) {
      counts[n.type] = (counts[n.type] ?? 0) + 1;
    }
    return counts;
  }, [allNotifications]);

  const presentTypes = TYPE_ORDER.filter((t) => (typeCounts[t] ?? 0) > 0);

  const grouped = useMemo(() => {
    if (activeFilter !== 'ALL') {
      return [
        {
          type: activeFilter,
          notifications: allNotifications.filter((n) => n.type === activeFilter),
        },
      ];
    }
    return presentTypes
      .map((type) => ({
        type,
        notifications: allNotifications.filter((n) => n.type === type),
      }))
      .filter((g) => g.notifications.length > 0);
  }, [allNotifications, activeFilter, presentTypes]);

  if (!token && !isLoading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-neutral-500 dark:text-neutral-400">
          Please log in to view your notifications.
        </p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-blue-600 dark:border-neutral-600 dark:border-t-blue-400" />
        </div>
      </main>
    );
  }

  const hasUnread = allNotifications.some((n) => !n.isRead);

  return (
    <>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-black dark:text-white">Notifications</h1>
          {hasUnread && (
            <button
              onClick={() => markAllAsReadMutation.mutate()}
              className={clsx(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium',
                'text-blue-600 transition-colors hover:bg-blue-50',
                'dark:text-blue-400 dark:hover:bg-blue-900/20',
              )}
            >
              <CheckIcon className="h-4 w-4" />
              Mark all as read
            </button>
          )}
        </div>

        {allNotifications.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <BellIcon className="mb-4 h-12 w-12 text-neutral-300 dark:text-neutral-600" />
            <p className="text-lg text-neutral-500 dark:text-neutral-400">
              No notifications yet
            </p>
          </div>
        ) : (
          <>
            {/* Filter tabs */}
            {presentTypes.length > 1 && (
              <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
                <button
                  onClick={() => setActiveFilter('ALL')}
                  className={clsx(
                    'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                    activeFilter === 'ALL'
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700',
                  )}
                >
                  All ({allNotifications.length})
                </button>
                {presentTypes.map((type) => {
                  const config = TYPE_CONFIG[type];
                  const count = typeCounts[type] ?? 0;
                  return (
                    <button
                      key={type}
                      onClick={() => setActiveFilter(type)}
                      className={clsx(
                        'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                        activeFilter === type
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700',
                      )}
                    >
                      {config.label} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            {/* Grouped notifications */}
            <div className="space-y-6">
              {grouped.map(({ type, notifications }) => {
                const config = TYPE_CONFIG[type];
                const Icon = config.icon;

                return (
                  <div key={type}>
                    <div className="mb-2 flex items-center gap-2">
                      <Icon className={clsx('h-4 w-4', config.color)} />
                      <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
                        {config.label}
                      </h2>
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                        {notifications.length}
                      </span>
                    </div>

                    <div className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 dark:divide-neutral-700 dark:border-neutral-700">
                      {notifications.map((notification) => {
                        const isReply = !!notification.metadata?.replyToNotificationId;
                        const originalBody = notification.metadata?.originalBody as string | undefined;

                        return (
                          <button
                            key={notification.id}
                            onClick={() =>
                              !notification.isRead && markAsReadMutation.mutate(notification.id)
                            }
                            className={clsx(
                              'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
                              notification.isRead
                                ? 'bg-white dark:bg-neutral-900'
                                : 'bg-blue-50 dark:bg-blue-950',
                              'hover:bg-neutral-50 dark:hover:bg-neutral-800',
                            )}
                          >
                            <div className="mt-0.5 flex-shrink-0">
                              {!notification.isRead ? (
                                <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                              ) : (
                                <span className="inline-block h-2 w-2" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              {isReply && originalBody && (
                                <div className="mb-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800">
                                  <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500">
                                    Your message
                                  </p>
                                  <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-300">
                                    {originalBody}
                                  </p>
                                </div>
                              )}
                              <p
                                className={clsx(
                                  'text-sm text-black dark:text-white',
                                  !notification.isRead && 'font-bold',
                                )}
                              >
                                {notification.title}
                              </p>
                              <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                                {notification.body}
                              </p>
                              <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                                {new Date(notification.createdAt).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {hasNextPage && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className={clsx(
                'rounded-lg px-6 py-2 text-sm font-medium transition-colors',
                'border border-neutral-300 text-neutral-700',
                'hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800',
                isFetchingNextPage && 'opacity-50',
              )}
            >
              {isFetchingNextPage ? 'Loading...' : 'Load more'}
            </button>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
