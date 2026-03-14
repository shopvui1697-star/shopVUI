'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import {
  ShoppingCartIcon,
  XMarkIcon,
  PlusIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import { formatCurrency } from '@shopvui/shared';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

export function CartModal() {
  const { cart, itemCount, updateItem, removeItem, isLoading } = useCart();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const prevItemCount = useRef(itemCount);

  // Auto-open when items are added
  useEffect(() => {
    if (itemCount > prevItemCount.current && itemCount > 0) {
      setIsOpen(true);
    }
    prevItemCount.current = itemCount;
  }, [itemCount]);

  const sortedItems = cart?.items
    ? [...cart.items].sort((a, b) => a.productName.localeCompare(b.productName))
    : [];

  return (
    <>
      <button
        aria-label="Open cart"
        onClick={() => setIsOpen(true)}
        className={clsx(
          'relative flex h-11 w-11 items-center justify-center rounded-md',
          'border border-neutral-200 text-black transition-colors',
          'hover:border-neutral-300',
          'dark:border-neutral-700 dark:text-white dark:hover:border-neutral-600'
        )}
      >
        <ShoppingCartIcon className="h-5 w-5 transition-all ease-in-out hover:scale-110" />
        {itemCount > 0 && (
          <span
            className={clsx(
              'absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center',
              'rounded-full bg-blue-600 text-[11px] font-medium text-white'
            )}
          >
            {itemCount}
          </span>
        )}
      </button>

      <Transition show={isOpen}>
        <Dialog onClose={() => setIsOpen(false)} className="relative z-50">
          {/* Backdrop */}
          <TransitionChild
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
          </TransitionChild>

          {/* Panel */}
          <TransitionChild
            enter="transition ease-in-out duration-300 transform"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <DialogPanel
              className={clsx(
                'fixed bottom-0 right-0 top-0 flex h-full w-full flex-col',
                'border-l border-neutral-200 bg-white p-6',
                'md:w-[390px]',
                'dark:border-neutral-700 dark:bg-neutral-900'
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg font-semibold text-black dark:text-white">
                  My Cart
                </DialogTitle>
                <button
                  aria-label="Close cart"
                  onClick={() => setIsOpen(false)}
                  className={clsx(
                    'flex h-8 w-8 items-center justify-center rounded-md',
                    'text-neutral-500 transition-colors hover:text-neutral-700',
                    'dark:text-neutral-400 dark:hover:text-neutral-200'
                  )}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              {!cart || sortedItems.length === 0 ? (
                <div className="mt-20 flex w-full flex-col items-center justify-center overflow-hidden">
                  <ShoppingCartIcon className="h-16 w-16 text-neutral-300 dark:text-neutral-600" />
                  <p className="mt-6 text-center text-2xl font-bold text-neutral-500 dark:text-neutral-400">
                    Your cart is empty.
                  </p>
                </div>
              ) : (
                <>
                  {/* Items list */}
                  <ul className="flex-grow overflow-auto py-4">
                    {sortedItems.map((item) => (
                      <li
                        key={item.id}
                        className={clsx(
                          'flex w-full gap-4 border-b border-neutral-200 py-4',
                          'dark:border-neutral-700'
                        )}
                      >
                        {/* Product image */}
                        <div
                          className={clsx(
                            'relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md',
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
                              sizes="64px"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <ShoppingCartIcon className="h-6 w-6 text-neutral-400 dark:text-neutral-500" />
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex flex-1 flex-col justify-between">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium leading-tight text-black dark:text-white">
                              {item.productName}
                            </span>
                            <button
                              onClick={() => removeItem(item.id)}
                              aria-label={`Remove ${item.productName}`}
                              disabled={isLoading}
                              className={clsx(
                                'ml-2 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full',
                                'border border-neutral-300 text-neutral-500 transition-colors',
                                'hover:border-neutral-400 hover:text-neutral-700',
                                'dark:border-neutral-600 dark:text-neutral-400',
                                'dark:hover:border-neutral-500 dark:hover:text-neutral-200',
                                'disabled:cursor-not-allowed disabled:opacity-50'
                              )}
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
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
                                disabled={isLoading}
                                className={clsx(
                                  'flex h-7 w-7 items-center justify-center rounded-full transition-colors',
                                  'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                                  'disabled:cursor-not-allowed disabled:opacity-50'
                                )}
                              >
                                <MinusIcon className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400" />
                              </button>
                              <span className="min-w-[2rem] text-center text-sm text-black dark:text-white">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateItem(item.id, item.quantity + 1)}
                                aria-label="Increase quantity"
                                disabled={isLoading}
                                className={clsx(
                                  'flex h-7 w-7 items-center justify-center rounded-full transition-colors',
                                  'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                                  'disabled:cursor-not-allowed disabled:opacity-50'
                                )}
                              >
                                <PlusIcon className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400" />
                              </button>
                            </div>

                            {/* Price */}
                            <span className="text-sm font-medium text-black dark:text-white">
                              {formatCurrency(item.subtotal, 'VND')}
                            </span>
                          </div>

                          {item.tierApplied && (
                            <span className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                              Tier: {item.tierApplied}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* Footer */}
                  <div className="border-t border-neutral-200 pt-4 dark:border-neutral-700">
                    <div className="mb-2 flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400">
                      <span>Subtotal</span>
                      <span>{formatCurrency(cart.subtotal, 'VND')}</span>
                    </div>
                    <div className="mb-4 flex items-center justify-between text-base font-bold text-black dark:text-white">
                      <span>Total</span>
                      <span>{formatCurrency(cart.total, 'VND')}</span>
                    </div>

                    {!user ? (
                      <Link
                        href="/login"
                        onClick={() => setIsOpen(false)}
                        className={clsx(
                          'block w-full rounded-full bg-neutral-800 px-6 py-3',
                          'text-center text-sm font-medium text-white',
                          'opacity-90 hover:opacity-100',
                          'dark:bg-white dark:text-black'
                        )}
                      >
                        Sign in to checkout
                      </Link>
                    ) : (
                      <Link
                        href="/cart"
                        onClick={() => setIsOpen(false)}
                        className={clsx(
                          'block w-full rounded-full bg-blue-600 px-6 py-3',
                          'text-center text-sm font-medium text-white',
                          'hover:bg-blue-700 transition-colors'
                        )}
                      >
                        Proceed to Checkout
                      </Link>
                    )}
                  </div>
                </>
              )}
            </DialogPanel>
          </TransitionChild>
        </Dialog>
      </Transition>
    </>
  );
}
