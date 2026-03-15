'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAdminUnreadCount } from '@/lib/api/notifications';

export function useNotificationCount() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-notifications', 'unread-count'],
    queryFn: fetchAdminUnreadCount,
    refetchInterval: 30_000,
  });

  return { count: data?.count ?? 0, isLoading };
}
