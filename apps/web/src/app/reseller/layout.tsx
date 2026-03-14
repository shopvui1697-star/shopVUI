'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const PUBLIC_PATHS = ['/reseller/register', '/reseller/login'];

const NAV_ITEMS = [
  { href: '/reseller/dashboard', label: 'Dashboard' },
  { href: '/reseller/orders', label: 'Orders' },
  { href: '/reseller/commissions', label: 'Commissions' },
  { href: '/reseller/coupons', label: 'Coupons' },
  { href: '/reseller/profile', label: 'Profile' },
];

export default function ResellerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (PUBLIC_PATHS.includes(pathname)) {
      setReady(true);
      return;
    }

    const token = localStorage.getItem('reseller_token');
    if (!token) {
      router.replace('/reseller/login');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role !== 'reseller') {
        router.replace('/reseller/login');
        return;
      }
    } catch {
      router.replace('/reseller/login');
      return;
    }

    setReady(true);
  }, [pathname, router]);

  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (!ready) return <div className="p-8 text-center">Loading...</div>;

  if (isPublic) return <>{children}</>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex items-center gap-6">
        <span className="font-bold text-lg">Reseller Portal</span>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`text-sm ${pathname === item.href ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
          >
            {item.label}
          </Link>
        ))}
        <button
          className="ml-auto text-sm text-gray-500 hover:text-gray-700"
          onClick={() => {
            localStorage.removeItem('reseller_token');
            router.replace('/reseller/login');
          }}
        >
          Logout
        </button>
      </nav>
      <main className="max-w-6xl mx-auto p-6">{children}</main>
    </div>
  );
}
