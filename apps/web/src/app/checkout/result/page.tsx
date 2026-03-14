'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { useTranslations } from 'next-intl';
import { Footer } from '../../../components/layout/footer';

export default function CheckoutResultPage() {
  const searchParams = useSearchParams();
  const t = useTranslations('payment');
  const ref = searchParams.get('ref');

  return (
    <>
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
        <CheckCircleIcon className="mb-4 h-16 w-16 text-green-500" />
        <h1 className="mb-2 text-2xl font-bold text-black dark:text-white">
          {t('orderPlaced')}
        </h1>
        {ref && (
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            {t('paymentReference')} <span className="font-semibold text-black dark:text-white">{ref}</span>
          </p>
        )}
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          {t('thankYou')}
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            href="/orders"
            className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            {t('viewMyOrders')}
          </Link>
          <Link
            href="/products"
            className="rounded-full border border-neutral-300 px-6 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            {t('continueShopping')}
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
