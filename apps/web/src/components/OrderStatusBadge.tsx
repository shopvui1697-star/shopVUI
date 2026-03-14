'use client';

import clsx from 'clsx';
import type { OrderStatus } from '@shopvui/shared';
import { useTranslations } from 'next-intl';

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  CONFIRMED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  SHIPPING: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  DELIVERED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  RETURNED: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
};

const STATUS_LABEL_KEYS: Record<OrderStatus, string> = {
  PENDING: 'statusPending',
  CONFIRMED: 'statusConfirmed',
  SHIPPING: 'statusShipping',
  DELIVERED: 'statusDelivered',
  CANCELLED: 'statusCancelled',
  RETURNED: 'statusReturned',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const t = useTranslations('orders');
  return (
    <span
      className={clsx(
        'inline-block rounded-full px-3 py-1 text-xs font-medium',
        STATUS_STYLES[status] || 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
      )}
      data-testid="order-status-badge"
    >
      {STATUS_LABEL_KEYS[status] ? t(STATUS_LABEL_KEYS[status]) : status}
    </span>
  );
}
