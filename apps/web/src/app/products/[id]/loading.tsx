export default function ProductDetailLoading() {
  return (
    <div className="mx-auto max-w-screen-2xl px-4 pb-4">
      <div className="mb-4 h-4 w-28 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />

      <div className="flex flex-col gap-8 md:flex-row">
        {/* Image skeleton */}
        <div className="w-full md:w-4/6">
          <div className="aspect-square animate-pulse rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900" />
          <div className="mt-2 flex gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 w-20 animate-pulse rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900"
              />
            ))}
          </div>
        </div>

        {/* Details skeleton */}
        <div className="w-full md:w-2/6">
          <div className="mb-2 h-4 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="mb-4 h-8 w-3/4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="mb-4 h-10 w-32 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />
          <div className="mb-6 h-6 w-24 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />
          <div className="mb-3 h-12 w-full animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />
          <div className="mb-3 h-12 w-full animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />
          <div className="mt-6 space-y-2 border-t border-neutral-200 pt-6 dark:border-neutral-800">
            <div className="h-4 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
          </div>
        </div>
      </div>
    </div>
  );
}
