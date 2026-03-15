import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { fetchUnreadCount } from '../lib/api/notifications';

export function useNotificationCount() {
  const { token } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => fetchUnreadCount(token!),
    enabled: !!token,
    refetchInterval: 30_000,
  });

  return { count: data?.count ?? 0, isLoading };
}
