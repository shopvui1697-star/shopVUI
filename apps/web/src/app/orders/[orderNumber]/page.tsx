'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import type { OrderDetail } from '@shopvui/shared';
import { formatCurrency } from '@shopvui/shared';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';
import { OrderStatusBadge } from '../../../components/OrderStatusBadge';
import * as api from '../../../lib/api';
import { Footer } from '../../../components/layout/footer';

export default function OrderDetailPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = use(params);
  const t = useTranslations('orders');
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .getOrder(token, orderNumber)
      .then(setOrder)
      .finally(() => setLoading(false));
  }, [token, orderNumber]);

  const handleCancel = async () => {
    if (!token || !confirm(t('cancelConfirm'))) return;
    setCancelling(true);
    try {
      await api.cancelOrder(token, orderNumber);
      const updated = await api.getOrder(token, orderNumber);
      setOrder(updated);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-blue-600 dark:border-neutral-600 dark:border-t-blue-400" />
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-neutral-500 dark:text-neutral-400">{t('orderNotFound')}</p>
      </main>
    );
  }

  return (
    <>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href="/orders"
          className="mb-6 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {t('backToOrders')}
        </Link>

        {/* Header */}
        <div className="mt-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-black dark:text-white">
            {t('orderNumber', { number: order.orderNumber })}
          </h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {t('placedOn', { date: new Date(order.date).toLocaleString() })}
        </p>

        {/* Order Items */}
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-black dark:text-white">{t('items')}</h2>
          <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-700">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4">
                {item.productImage && (
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="h-16 w-16 rounded-md object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="font-semibold text-black dark:text-white">{item.productName}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {formatCurrency(item.unitPrice, 'VND')} x {item.quantity}
                  </p>
                </div>
                <div className="font-semibold text-black dark:text-white">
                  {formatCurrency(item.subtotal, 'VND')}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Summary */}
        <section className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-neutral-500 dark:text-neutral-400">{t('subtotal')}</span>
            <span className="text-black dark:text-white">{formatCurrency(order.subtotal, 'VND')}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="mb-2 flex justify-between text-sm text-green-600 dark:text-green-400">
              <span>{order.couponCode ? t('discountWithCode', { code: order.couponCode }) : t('discount')}</span>
              <span>-{formatCurrency(order.discountAmount, 'VND')}</span>
            </div>
          )}
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-neutral-500 dark:text-neutral-400">{t('shipping')}</span>
            <span className="text-black dark:text-white">
              {order.shippingFee === 0 ? t('shippingFree') : formatCurrency(order.shippingFee, 'VND')}
            </span>
          </div>
          <hr className="my-2 border-neutral-200 dark:border-neutral-700" />
          <div className="flex justify-between text-lg font-bold">
            <span className="text-black dark:text-white">{t('total')}</span>
            <span className="text-black dark:text-white">{formatCurrency(order.total, 'VND')}</span>
          </div>
        </section>

        {/* Shipping Address */}
        <section className="mt-6">
          <h2 className="mb-2 text-lg font-semibold text-black dark:text-white">{t('shippingAddress')}</h2>
          <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
            <p className="font-medium text-black dark:text-white">{order.address.fullName}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {order.address.street}, {order.address.ward}, {order.address.district}, {order.address.province}
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{order.address.phone}</p>
          </div>
        </section>

        {/* Payment Info */}
        <section className="mt-6">
          <h2 className="mb-2 text-lg font-semibold text-black dark:text-white">{t('payment')}</h2>
          <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              {t('method')} <span className="font-semibold">{order.paymentMethod.replace('_', ' ')}</span>
            </p>
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              {t('status')} <span className="font-semibold">{order.paymentStatus}</span>
            </p>
          </div>
        </section>

        {/* Status History */}
        {order.statusHistory.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-3 text-lg font-semibold text-black dark:text-white">{t('statusHistory')}</h2>
            <div className="space-y-2">
              {order.statusHistory.map((entry, i) => (
                <div key={i} className="flex items-center gap-4 text-sm">
                  <span className="min-w-[160px] text-neutral-500 dark:text-neutral-400">
                    {new Date(entry.createdAt).toLocaleString()}
                  </span>
                  <OrderStatusBadge status={entry.status} />
                  {entry.note && (
                    <span className="text-neutral-500 dark:text-neutral-400">{entry.note}</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Cancel Button */}
        {order.status === 'PENDING' && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className={clsx(
              'mt-8 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-colors',
              cancelling
                ? 'cursor-not-allowed bg-neutral-400'
                : 'bg-red-600 hover:bg-red-700'
            )}
          >
            {cancelling ? t('cancelling') : t('cancelOrder')}
          </button>
        )}
      </main>
      <Footer />
    </>
  );
}
