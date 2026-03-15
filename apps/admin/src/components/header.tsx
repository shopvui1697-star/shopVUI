'use client';

import { logout } from '@/lib/auth';
import { NotificationBell } from './NotificationBell';

export function Header() {
  function handleLogout() {
    logout();
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
      <h1 className="text-lg font-semibold text-gray-900">Admin Dashboard</h1>
      <div className="flex items-center gap-2">
        <NotificationBell />
        <button
          onClick={handleLogout}
          className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
