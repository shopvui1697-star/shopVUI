import { apiFetch } from '../api';
import type { NotificationTemplateData, NotificationType } from '@shopvui/shared';

export async function fetchTemplates(): Promise<NotificationTemplateData[]> {
  return apiFetch<NotificationTemplateData[]>('/admin/notification-templates');
}

export async function createTemplate(data: {
  name: string;
  title: string;
  body: string;
  type: NotificationType;
  autoShow?: boolean;
}): Promise<NotificationTemplateData> {
  return apiFetch<NotificationTemplateData>('/admin/notification-templates', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTemplate(
  id: string,
  data: {
    name?: string;
    title?: string;
    body?: string;
    type?: NotificationType;
    autoShow?: boolean;
  },
): Promise<NotificationTemplateData> {
  return apiFetch<NotificationTemplateData>(
    `/admin/notification-templates/${id}`,
    { method: 'PATCH', body: JSON.stringify(data) },
  );
}

export async function deleteTemplate(id: string): Promise<void> {
  await apiFetch(`/admin/notification-templates/${id}`, { method: 'DELETE' });
}
