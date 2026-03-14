export default function OrdersLoading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 h-8 w-40 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700"
          />
        ))}
      </div>
    </main>
  );
}
