'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import clsx from 'clsx';
import {
  ShoppingCartIcon,
  XMarkIcon,
  PlusIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency } from '@shopvui/shared';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import * as api from '../../lib/api';
import { Footer } from '../../components/layout/footer';

export default function CartPage() {
  const { cart, isLoading, updateItem, removeItem } = useCart();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState('');

  useEffect(() => {
    const couponParam = searchParams.get('coupon');
    if (couponParam) setCouponCode(couponParam);
  }, [searchParams]);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-screen-2xl px-4 py-12 lg:px-6">
        <div className="flex animate-pulse flex-col items-center justify-center py-20">
          <div className="h-8 w-48 rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="mt-6 h-4 w-32 rounded bg-neutral-200 dark:bg-neutral-700" />
        </div>
      </main>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <>
        <main className="mx-auto max-w-screen-2xl px-4 py-12 lg:px-6">
          <div className="flex flex-col items-center justify-center py-20">
            <ShoppingCartIcon className="h-16 w-16 text-neutral-300 dark:text-neutral-600" />
            <h1 className="mt-6 text-2xl font-bold text-black dark:text-white">
              Your cart is empty
            </h1>
            <p className="mt-2 text-neutral-500 dark:text-neutral-400">
              Looks like you haven&apos;t added anything yet.
            </p>
            <Link
              href="/products"
              className={clsx(
                'mt-8 rounded-full bg-blue-600 px-8 py-3',
                'text-sm font-medium text-white',
                'hover:bg-blue-700 transition-colors'
              )}
            >
              Continue Shopping
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <main className="mx-auto max-w-screen-2xl px-4 py-12 lg:px-6">
        <h1 className="text-2xl font-bold text-black dark:text-white">Shopping Cart</h1>

        <div className="mt-8 lg:grid lg:grid-cols-3 lg:gap-12">
          {/* Cart Items - Left Column */}
          <div className="lg:col-span-2">
            <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {cart.items.map((item) => (
                <li key={item.id} className="flex gap-4 py-6" data-testid="cart-item">
                  {/* Product Image */}
                  <div
                    className={clsx(
                      'relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg',
                      'border border-neutral-200 bg-neutral-100',
                      'dark:border-neutral-700 dark:bg-neutral-800'
                    )}
                  >
                    {item.productImage ? (
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ShoppingCartIcon className="h-8 w-8 text-neutral-400 dark:text-neutral-500" />
                      </div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="text-base font-medium text-black dark:text-white">
                          {item.productName}
                        </h3>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                          {formatCurrency(item.unitPrice, 'VND')} / unit
                          {item.tierApplied && (
                            <span className="ml-2 text-emerald-600 dark:text-emerald-400">
                              (Tier: {item.tierApplied})
                            </span>
                          )}
                        </p>
                      </div>
                      <p className="text-base font-medium text-black dark:text-white">
                        {formatCurrency(item.subtotal, 'VND')}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      {/* Quantity controls */}
                      <div
                        className={clsx(
                          'flex items-center rounded-full border',
                          'border-neutral-200 dark:border-neutral-700'
                        )}
                      >
                        <button
                          onClick={() => {
                            if (item.quantity <= 1) {
                              removeItem(item.id);
                            } else {
                              updateItem(item.id, item.quantity - 1);
                            }
                          }}
                          aria-label="Decrease quantity"
                          className={clsx(
                            'flex h-9 w-9 items-center justify-center rounded-full transition-colors',
                            'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          )}
                        >
                          <MinusIcon className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                        </button>
                        <span className="min-w-[2.5rem] text-center text-sm font-medium text-black dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateItem(item.id, item.quantity + 1)}
                          aria-label="Increase quantity"
                          className={clsx(
                            'flex h-9 w-9 items-center justify-center rounded-full transition-colors',
                            'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          )}
                        >
                          <PlusIcon className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                        </button>
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remove ${item.productName}`}
                        className={clsx(
                          'flex items-center gap-1 text-sm text-neutral-500 transition-colors',
                          'hover:text-red-600',
                          'dark:text-neutral-400 dark:hover:text-red-400'
                        )}
                      >
                        <XMarkIcon className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Order Summary - Right Column */}
          <div className="mt-8 lg:mt-0">
            <div
              className={clsx(
                'rounded-xl border p-6',
                'border-neutral-200 bg-neutral-50',
                'dark:border-neutral-700 dark:bg-neutral-800/50'
              )}
            >
              <h2 className="text-lg font-semibold text-black dark:text-white">
                Order Summary
              </h2>

              <dl className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-neutral-500 dark:text-neutral-400">Subtotal</dt>
                  <dd className="text-sm font-medium text-black dark:text-white">
                    {formatCurrency(cart.subtotal, 'VND')}
                  </dd>
                </div>

                {cart.couponDiscount > 0 && (
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-emerald-600 dark:text-emerald-400">Coupon Discount</dt>
                    <dd className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      -{formatCurrency(cart.couponDiscount, 'VND')}
                    </dd>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <dt className="text-sm text-neutral-500 dark:text-neutral-400">Shipping</dt>
                  <dd className="text-sm font-medium text-black dark:text-white">
                    {cart.shippingFee === 0 ? 'Free' : formatCurrency(cart.shippingFee, 'VND')}
                  </dd>
                </div>

                {cart.shippingFee === 0 && (
                  <p className="text-xs text-neutral-400 dark:text-neutral-500">
                    Shipping calculated at checkout
                  </p>
                )}

                <div className="border-t border-neutral-200 pt-3 dark:border-neutral-700">
                  <div className="flex items-center justify-between">
                    <dt className="text-base font-bold text-black dark:text-white">Total</dt>
                    <dd className="text-base font-bold text-black dark:text-white">
                      {formatCurrency(cart.total, 'VND')}
                    </dd>
                  </div>
                </div>
              </dl>

              {/* Coupon Input */}
              <div className="mt-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Coupon code"
                    data-testid="coupon-input"
                    className={clsx(
                      'flex-1 rounded-lg border px-3 py-2 text-sm',
                      'border-neutral-300 bg-white text-black placeholder-neutral-400',
                      'focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
                      'dark:border-neutral-600 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500',
                      'dark:focus:border-blue-400 dark:focus:ring-blue-400'
                    )}
                  />
                  <button
                    onClick={async () => {
                      if (!couponCode.trim()) return;
                      const token = localStorage.getItem('token');
                      if (!token || !cart) {
                        setCouponMessage('Please log in to apply coupons');
                        return;
                      }
                      try {
                        const result = await api.validateCoupon(
                          token,
                          couponCode,
                          cart.items,
                          cart.subtotal,
                        );
                        setCouponMessage(result.message);
                      } catch {
                        setCouponMessage('Failed to validate coupon');
                      }
                    }}
                    className={clsx(
                      'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                      'bg-neutral-800 text-white hover:bg-neutral-700',
                      'dark:bg-neutral-600 dark:hover:bg-neutral-500'
                    )}
                  >
                    Apply
                  </button>
                </div>
                {couponMessage && (
                  <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    {couponMessage}
                  </p>
                )}
              </div>

              {/* Checkout Button */}
              {!user ? (
                <Link
                  href="/login"
                  className={clsx(
                    'mt-6 block w-full rounded-full px-6 py-3',
                    'text-center text-sm font-medium transition-colors',
                    'bg-neutral-800 text-white hover:bg-neutral-700',
                    'dark:bg-white dark:text-black dark:hover:bg-neutral-200'
                  )}
                >
                  Sign in to checkout
                </Link>
              ) : (
                <Link
                  href="/checkout"
                  className={clsx(
                    'mt-6 block w-full rounded-full bg-blue-600 px-6 py-3',
                    'text-center text-sm font-medium text-white transition-colors',
                    'hover:bg-blue-700'
                  )}
                >
                  Proceed to Checkout
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
