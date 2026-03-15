'use client';

import Link from 'next/link';
import { BellIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useNotificationCount } from '../../../hooks/useNotificationCount';

export function NotificationBell() {
  const { count, isLoading } = useNotificationCount();

  if (isLoading) return null;

  return (
    <Link
      href="/account/notifications"
      className={clsx(
        'relative rounded-lg p-2 transition-colors',
        'text-neutral-600 hover:bg-neutral-100 hover:text-black',
        'dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white',
      )}
      aria-label={count > 0 ? `${count} unread notifications` : 'Notifications'}
    >
      <BellIcon className="h-5 w-5" />
      {count > 0 && (
        <span
          className={clsx(
            'absolute -right-0.5 -top-0.5 flex items-center justify-center',
            'min-w-[18px] rounded-full bg-red-500 px-1 py-0.5',
            'text-[10px] font-bold leading-none text-white',
          )}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
