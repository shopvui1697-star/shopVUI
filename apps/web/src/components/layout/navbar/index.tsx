'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Suspense, useState, useRef, useEffect } from 'react';
import {
  ArrowRightStartOnRectangleIcon,
  ShoppingBagIcon,
  HeartIcon,
  MapPinIcon,
  UserCircleIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useTranslations } from 'next-intl';
import { useAuth } from '../../../contexts/AuthContext';
import { Search } from './search';
import { CartModal } from '../../cart/cart-modal';
import { LanguageSwitcher } from '../../LanguageSwitcher';
import { ThemeToggle } from '../../ThemeToggle';

export function Navbar() {
  const t = useTranslations('nav');

  const navLinks = [
    { href: '/products', label: t('products') },
    { href: '/orders', label: t('orders') },
  ];

  const userMenuLinks = [
    { href: '/orders', label: t('myOrders'), icon: ShoppingBagIcon },
    { href: '/account/wishlist', label: t('wishlist'), icon: HeartIcon },
    { href: '/account/addresses', label: t('myAddresses'), icon: MapPinIcon },
  ];
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    router.push('/');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav
      className={clsx(
        'sticky top-0 z-50 border-b',
        'bg-white/80 backdrop-blur-xl',
        'dark:bg-neutral-900/80'
      )}
    >
      <div className="mx-auto flex max-w-screen-2xl items-center px-4 py-3 lg:px-6">
        {/* LEFT: Logo + Nav Links */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-black hover:text-neutral-600 dark:text-white dark:hover:text-neutral-300"
          >
            ShopVUI
          </Link>

          <ul className="hidden gap-4 md:flex">
            {navLinks.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={clsx(
                    'text-sm text-neutral-500 underline-offset-4',
                    'hover:text-black hover:underline',
                    'dark:text-neutral-400 dark:hover:text-neutral-300'
                  )}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* CENTER: Search */}
        <div className="mx-4 flex-1 md:mx-8">
          <Suspense fallback={<div className="h-10" />}>
            <Search />
          </Suspense>
        </div>

        {/* RIGHT: User + Cart */}
        <div className="flex items-center gap-3">
          {!isLoading && (
            <>
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((prev) => !prev)}
                    className={clsx(
                      'flex items-center gap-2 rounded-lg px-2 py-1.5',
                      'text-sm transition-colors',
                      'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    )}
                    aria-haspopup="true"
                    aria-expanded={dropdownOpen}
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        referrerPolicy="no-referrer"
                        className="h-7 w-7 rounded-full"
                      />
                    ) : (
                      <span
                        className={clsx(
                          'flex h-7 w-7 items-center justify-center rounded-full',
                          'bg-neutral-900 text-xs font-bold text-white',
                          'dark:bg-neutral-100 dark:text-black'
                        )}
                      >
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    )}
                    <span className="hidden text-sm text-neutral-700 dark:text-neutral-300 lg:inline">
                      {user.name}
                    </span>
                    <ChevronDownIcon
                      className={clsx(
                        'h-4 w-4 text-neutral-400 transition-transform duration-200',
                        dropdownOpen && 'rotate-180'
                      )}
                    />
                  </button>

                  {dropdownOpen && (
                    <div
                      className={clsx(
                        'absolute right-0 mt-2 w-52 origin-top-right',
                        'rounded-xl border bg-white shadow-lg',
                        'dark:border-neutral-700 dark:bg-neutral-900',
                        'animate-in fade-in slide-in-from-top-1 duration-150'
                      )}
                    >
                      {/* User info header */}
                      <div className="border-b px-4 py-3 dark:border-neutral-700">
                        <div className="flex items-center gap-2.5">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              referrerPolicy="no-referrer"
                              className="h-8 w-8 rounded-full"
                            />
                          ) : (
                            <span
                              className={clsx(
                                'flex h-8 w-8 items-center justify-center rounded-full',
                                'bg-neutral-900 text-sm font-bold text-white',
                                'dark:bg-neutral-100 dark:text-black'
                              )}
                            >
                              {user.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-black dark:text-white">
                              {user.name}
                            </p>
                            <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Menu links */}
                      <ul className="py-1">
                        {userMenuLinks.map(({ href, label, icon: Icon }) => (
                          <li key={href}>
                            <Link
                              href={href}
                              onClick={() => setDropdownOpen(false)}
                              className={clsx(
                                'flex items-center gap-2.5 px-4 py-2.5',
                                'text-sm text-neutral-700 dark:text-neutral-300',
                                'hover:bg-neutral-50 dark:hover:bg-neutral-800',
                                'transition-colors'
                              )}
                            >
                              <Icon className="h-4 w-4 text-neutral-400" />
                              {label}
                            </Link>
                          </li>
                        ))}
                      </ul>

                      <LanguageSwitcher variant="dropdown-item" onSelect={() => setDropdownOpen(false)} />
                      <ThemeToggle variant="dropdown-item" onToggle={() => setDropdownOpen(false)} />

                      {/* Logout */}
                      <div className="border-t py-1 dark:border-neutral-700">
                        <button
                          onClick={handleLogout}
                          className={clsx(
                            'flex w-full items-center gap-2.5 px-4 py-2.5',
                            'text-sm text-red-600 dark:text-red-400',
                            'hover:bg-red-50 dark:hover:bg-red-900/20',
                            'transition-colors'
                          )}
                        >
                          <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
                          {t('signOut')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={clsx(
                      'flex items-center gap-1.5 text-sm font-medium',
                      'text-neutral-600 hover:text-black',
                      'dark:text-neutral-400 dark:hover:text-white'
                    )}
                  >
                    <UserCircleIcon className="h-5 w-5" />
                    {t('login')}
                  </Link>
                  <LanguageSwitcher variant="standalone" />
                  <ThemeToggle />
                </>
              )}
            </>
          )}

          {/* Cart Modal */}
          <CartModal />
        </div>
      </div>

    </nav>
  );
}
