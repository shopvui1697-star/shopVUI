'use client';

import Link from 'next/link';

export default function ProductDetailError({
  _error,
  reset,
}: {
  _error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h2 className="mb-2 text-2xl font-bold text-black dark:text-white">
        Unable to load product
      </h2>
      <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
        We couldn&apos;t load this product. It may be unavailable or there was a temporary issue.
      </p>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="rounded-full bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Try again
        </button>
        <Link
          href="/products"
          className="rounded-full border border-neutral-200 px-6 py-3 text-sm font-medium text-neutral-600 transition-colors hover:border-neutral-400 hover:text-black dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-500 dark:hover:text-white"
        >
          Browse products
        </Link>
      </div>
    </div>
  );
}
