import type { NotificationData, PaginatedResponse, UnreadCountResponse } from '@shopvui/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export async function fetchNotifications(
  token: string,
  page = 1,
  pageSize = 20,
): Promise<PaginatedResponse<NotificationData>> {
  const res = await fetch(
    `${API_URL}/notifications?page=${page}&pageSize=${pageSize}`,
    { headers: authHeaders(token) },
  );
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

export async function fetchUnreadCount(token: string): Promise<UnreadCountResponse> {
  const res = await fetch(`${API_URL}/notifications/unread-count`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to fetch unread count');
  return res.json();
}

export async function markAsRead(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/notifications/${id}/read`, {
    method: 'PATCH',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to mark notification as read');
}

export async function markAllAsRead(token: string): Promise<void> {
  const res = await fetch(`${API_URL}/notifications/read-all`, {
    method: 'PATCH',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to mark all notifications as read');
}
