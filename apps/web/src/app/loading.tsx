export default function RootLoading() {
  return (
    <main className="mx-auto max-w-screen-2xl px-4 py-8">
      <div className="mb-6 h-8 w-48 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700"
          />
        ))}
      </div>
    </main>
  );
}
