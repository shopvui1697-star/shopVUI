'use client';

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 text-center text-white">
      <svg
        className="mb-6 h-16 w-16 text-slate-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12 18.75h.008v.008H12v-.008Z"
        />
        <line x1="4" y1="4" x2="20" y2="20" strokeLinecap="round" />
      </svg>
      <h1 className="mb-2 text-2xl font-bold">You are currently offline</h1>
      <p className="mb-8 text-sm text-slate-400">
        Please check your internet connection and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="rounded-lg bg-slate-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-600"
      >
        Retry
      </button>
    </main>
  );
}
