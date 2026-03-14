'use client';

import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function OrdersError({
  _error,
  reset,
}: {
  _error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <ExclamationTriangleIcon className="mb-4 h-12 w-12 text-neutral-400 dark:text-neutral-500" />
      <h2 className="mb-2 text-2xl font-semibold text-black dark:text-white">
        Unable to load orders
      </h2>
      <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
        We couldn&apos;t load your orders right now. Please try again.
      </p>
      <button
        onClick={() => reset()}
        className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
      >
        <ArrowPathIcon className="h-4 w-4" />
        Try again
      </button>
    </main>
  );
}
