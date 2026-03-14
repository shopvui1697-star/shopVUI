'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import type { OrderSummary } from '@shopvui/shared';
import { formatCurrency } from '@shopvui/shared';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';
import * as api from '../../lib/api';
import { Footer } from '../../components/layout/footer';

export default function OrdersPage() {
  const t = useTranslations('orders');
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .getOrders(token, page)
      .then((res) => {
        setOrders(res.data);
        setTotalPages(res.totalPages);
      })
      .finally(() => setLoading(false));
  }, [token, page]);

  if (!token) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold text-black dark:text-white">{t('title')}</h1>
        <p className="mt-4 text-neutral-500 dark:text-neutral-400">{t('loginRequired')}</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-blue-600 dark:border-neutral-600 dark:border-t-blue-400" />
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-black dark:text-white">{t('title')}</h1>

        {orders.length === 0 ? (
          <p className="py-12 text-center text-neutral-500 dark:text-neutral-400">{t('noOrders')}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <Link
                key={order.orderNumber}
                href={`/orders/${order.orderNumber}`}
                className="group block rounded-lg border border-neutral-200 p-4 transition-colors hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:border-neutral-600 dark:hover:bg-neutral-800/50"
                data-testid="order-card"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-black group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                      {t('orderNumber', { number: order.orderNumber })}
                    </p>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                      {new Date(order.date).toLocaleDateString()} | {t('itemCount', { count: order.itemCount })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="mb-1 font-semibold text-black dark:text-white">
                      {formatCurrency(order.total, 'VND')}
                    </p>
                    <OrderStatusBadge status={order.status} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className={clsx(
                'inline-flex items-center gap-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                page === 1
                  ? 'cursor-not-allowed border-neutral-200 text-neutral-300 dark:border-neutral-700 dark:text-neutral-600'
                  : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800'
              )}
            >
              <ChevronLeftIcon className="h-4 w-4" />
              {t('previous')}
            </button>
            <span className="px-4 py-2 text-sm text-neutral-500 dark:text-neutral-400">
              {t('pageOf', { current: String(page), total: String(totalPages) })}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className={clsx(
                'inline-flex items-center gap-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                page === totalPages
                  ? 'cursor-not-allowed border-neutral-200 text-neutral-300 dark:border-neutral-700 dark:text-neutral-600'
                  : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800'
              )}
            >
              {t('next')}
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
