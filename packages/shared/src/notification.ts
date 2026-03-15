export type NotificationType =
  | 'ORDER_STATUS'
  | 'PAYMENT'
  | 'COMMISSION'
  | 'SYSTEM'
  | 'ADMIN_ALERT'
  | 'RESELLER'
  | 'CONVERSATION';

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  metadata: Record<string, unknown> | null;
  templateId: string | null;
  autoShow: boolean;
  createdAt: string;
}

export interface NotificationTemplateData {
  id: string;
  name: string;
  title: string;
  body: string;
  type: NotificationType;
  autoShow: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UnreadCountResponse {
  count: number;
}
