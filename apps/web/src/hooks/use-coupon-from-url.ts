'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const STORAGE_KEY = 'pendingCoupon';

/**
 * Reads ?coupon= from URL and stores in sessionStorage.
 * Mount in root layout or checkout layout.
 */
export function useCouponFromUrl() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const coupon = searchParams.get('coupon');
    if (coupon) {
      sessionStorage.setItem(STORAGE_KEY, coupon);
    }
  }, [searchParams]);
}

/**
 * Returns the pending coupon from sessionStorage and a function to clear it.
 */
export function usePendingCoupon(): { coupon: string | null; clearCoupon: () => void } {
  const coupon = typeof window !== 'undefined' ? sessionStorage.getItem(STORAGE_KEY) : null;

  const clearCoupon = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  };

  return { coupon, clearCoupon };
}
