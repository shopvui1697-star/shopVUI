'use client';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

export default function CartError({
  _error,
  reset,
}: {
  _error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
      <div
        className={clsx(
          'flex h-16 w-16 items-center justify-center rounded-full',
          'bg-red-50 dark:bg-red-900/20'
        )}
      >
        <ExclamationTriangleIcon className="h-8 w-8 text-red-500 dark:text-red-400" />
      </div>

      <h2 className="mt-6 text-xl font-bold text-black dark:text-white">
        Unable to load your cart
      </h2>

      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        We couldn&apos;t load your cart right now. Your items are still saved.
      </p>

      <button
        onClick={() => reset()}
        className={clsx(
          'mt-8 rounded-full px-8 py-3 text-sm font-medium transition-colors',
          'bg-blue-600 text-white hover:bg-blue-700'
        )}
      >
        Try again
      </button>
    </main>
  );
}
