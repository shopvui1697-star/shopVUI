export default function CartLoading() {
  return (
    <main className="mx-auto max-w-screen-2xl px-4 py-12 lg:px-6">
      {/* Title skeleton */}
      <div className="h-8 w-48 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />

      <div className="mt-8 lg:grid lg:grid-cols-3 lg:gap-12">
        {/* Cart items skeleton */}
        <div className="lg:col-span-2">
          <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 py-6">
                <div className="h-24 w-24 flex-shrink-0 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <div className="h-5 w-3/5 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                    <div className="mt-2 h-4 w-2/5 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="h-9 w-28 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
                    <div className="h-4 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order summary skeleton */}
        <div className="mt-8 lg:mt-0">
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-700 dark:bg-neutral-800/50">
            <div className="h-6 w-36 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="mt-6 space-y-3">
              <div className="flex justify-between">
                <div className="h-4 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                <div className="h-4 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                <div className="h-4 w-12 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
              </div>
              <div className="border-t border-neutral-200 pt-3 dark:border-neutral-700">
                <div className="flex justify-between">
                  <div className="h-5 w-12 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                  <div className="h-5 w-28 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                </div>
              </div>
            </div>
            <div className="mt-6 h-10 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
            <div className="mt-4 h-12 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
          </div>
        </div>
      </div>
    </main>
  );
}
