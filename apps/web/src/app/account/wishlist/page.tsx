'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { useTranslations } from 'next-intl';
import { formatCurrency } from '@shopvui/shared';
import { XMarkIcon, HeartIcon } from '@heroicons/react/24/outline';
import * as api from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import { Footer } from '../../../components/layout/footer';

interface WishlistItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    price: number;
    stockQuantity: number;
    images: Array<{ url: string; alt?: string }>;
  };
}

export default function WishlistPage() {
  const { token } = useAuth();
  const t = useTranslations('account.wishlist');
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api.getWishlist(token)
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const handleRemove = async (productId: string) => {
    if (!token) return;


    setRemovingIds((prev) => new Set(prev).add(productId));
    const previousItems = items;
    setItems(items.filter((item) => item.productId !== productId));

    try {
      await api.removeFromWishlist(token, productId);
    } catch {
      setItems(previousItems);
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  if (!token && !loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-neutral-500 dark:text-neutral-400">{t('loginRequired')}</p>
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

        {items.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center" data-testid="empty-state">
            <HeartIcon className="mb-4 h-12 w-12 text-neutral-300 dark:text-neutral-600" />
            <p className="text-lg text-neutral-500 dark:text-neutral-400">{t('empty')}</p>
            <Link
              href="/products"
              className="mt-4 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              {t('browseProducts')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const product = item.product;
              const image = product.images?.[0];
              const inStock = product.stockQuantity > 0;

              return (
                <div
                  key={item.id}
                  data-testid="wishlist-item"
                  className="group relative rounded-lg border border-neutral-200 bg-white transition-colors hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-600"
                >
                  {/* Remove button */}
                  <button
                    onClick={() => handleRemove(item.productId)}
                    disabled={removingIds.has(item.productId)}
                    data-testid="remove-button"
                    className="absolute right-2 top-2 z-10 rounded-full bg-white/80 p-1.5 text-neutral-500 backdrop-blur transition-colors hover:bg-white hover:text-red-500 dark:bg-neutral-800/80 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-red-400"
                    title={t('removeFromWishlist')}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>

                  <Link href={`/products/${product.id}`} className="block">
                    {image && (
                      <div className="aspect-square overflow-hidden rounded-t-lg bg-neutral-100 dark:bg-neutral-800">
                        <img
                          src={image.url}
                          alt={image.alt ?? product.name}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <p className="font-semibold text-black dark:text-white">
                        {product.name}
                      </p>
                      <p className="mt-1 text-sm font-bold text-black dark:text-white">
                        {formatCurrency(product.price, 'VND')}
                      </p>
                      <span
                        className={clsx(
                          'mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                          inStock
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        )}
                        data-testid="stock-badge"
                      >
                        {inStock ? t('inStock') : t('outOfStock')}
                      </span>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
