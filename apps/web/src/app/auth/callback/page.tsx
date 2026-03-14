'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken') || undefined;

    if (accessToken) {
      login(accessToken, refreshToken).then(() => {
        router.replace('/');
      });
    } else {
      router.replace('/login');
    }
  }, [searchParams, router, login]);

  return (
    <main className="flex min-h-[calc(100vh-60px)] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-blue-600 dark:border-neutral-600 dark:border-t-blue-400" />
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Signing you in...</p>
      </div>
    </main>
  );
}
