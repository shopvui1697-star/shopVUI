export default function ProductsLoading() {
  return (
    <div className="mx-auto flex max-w-screen-2xl flex-col gap-8 px-4 pb-4 md:flex-row">
      {/* Sidebar skeleton */}
      <div className="order-first w-full flex-none md:max-w-[125px]">
        <div className="mb-4 h-10 w-full animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        <div className="hidden space-y-2 md:block">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800"
              style={{ width: `${60 + i * 10}%` }}
            />
          ))}
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="w-full">
        <div className="mb-4 h-4 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-square animate-pulse overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex h-full w-full items-end p-4">
                <div className="flex w-full items-center gap-2 rounded-full border border-neutral-200 bg-white/70 p-2 dark:border-neutral-700 dark:bg-black/70">
                  <div className="h-3 flex-grow rounded bg-neutral-200 dark:bg-neutral-700" />
                  <div className="h-6 w-16 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
