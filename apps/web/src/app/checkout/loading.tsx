export default function CheckoutLoading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 h-8 w-36 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <div className="h-44 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-44 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
        </div>
        <div className="h-72 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
      </div>
    </main>
  );
}
