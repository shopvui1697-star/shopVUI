'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useState, useEffect } from 'react';

export function Search() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('search') || '');

  useEffect(() => {
    setQuery(searchParams.get('search') || '');
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/products?search=${encodeURIComponent(trimmed)}`);
    } else {
      router.push('/products');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <MagnifyingGlassIcon
        className={clsx(
          'absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2',
          'text-neutral-400 dark:text-neutral-500'
        )}
      />
      <input
        type="text"
        name="search"
        placeholder="Search for products..."
        autoComplete="off"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={clsx(
          'w-full rounded-lg border bg-transparent py-2 pl-9 pr-4 text-sm',
          'border-neutral-200 text-black placeholder:text-neutral-500',
          'dark:border-neutral-800 dark:text-white dark:placeholder:text-neutral-400',
          'focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400',
          'dark:focus:border-neutral-600 dark:focus:ring-neutral-600'
        )}
      />
    </form>
  );
}
