'use client';

import { Suspense } from 'react';
import { useCouponFromUrl } from '../hooks/use-coupon-from-url';

function CouponCaptureInner() {
  useCouponFromUrl();
  return null;
}

export function CouponCapture() {
  return (
    <Suspense fallback={null}>
      <CouponCaptureInner />
    </Suspense>
  );
}
