'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', exact: true },
  { href: '/orders', label: 'Orders' },
  { href: '/products', label: 'Products' },
  { href: '/coupons', label: 'Coupons' },
  { href: '/resellers', label: 'Resellers' },
  { href: '/customers', label: 'Customers' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/imports', label: 'Imports' },
  { href: '/channels', label: 'Channels' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-14 items-center border-b border-gray-200 px-4">
        <span className="text-lg font-bold text-blue-600">ShopVui</span>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {NAV_ITEMS.map((item) => {
          const active = 'exact' in item && item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
