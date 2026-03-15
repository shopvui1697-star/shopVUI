import { apiFetch } from '../api';
import type { NotificationData, NotificationType, UnreadCountResponse } from '@shopvui/shared';

export interface PaginatedNotificationsResponse {
  data: NotificationData[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SendNotificationRequest {
  targetUserIds: string[];
  templateId?: string;
  type?: NotificationType;
  title?: string;
  body?: string;
  variables?: Record<string, string>;
}

export async function fetchAdminNotifications(
  page = 1,
  pageSize = 20,
): Promise<PaginatedNotificationsResponse> {
  return apiFetch<PaginatedNotificationsResponse>(
    `/admin/notifications?page=${page}&pageSize=${pageSize}`,
  );
}

export async function fetchAdminUnreadCount(): Promise<UnreadCountResponse> {
  return apiFetch<UnreadCountResponse>('/admin/notifications/unread-count');
}

export async function markAdminNotificationAsRead(id: string): Promise<void> {
  await apiFetch(`/admin/notifications/${id}/read`, { method: 'PATCH' });
}

export async function markAllAdminNotificationsAsRead(): Promise<void> {
  await apiFetch('/admin/notifications/read-all', { method: 'PATCH' });
}

export async function sendNotification(data: SendNotificationRequest): Promise<void> {
  await apiFetch('/admin/notifications/send', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function replyToNotification(id: string, message: string): Promise<void> {
  await apiFetch(`/admin/notifications/${id}/reply`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}
