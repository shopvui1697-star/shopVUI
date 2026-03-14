'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import * as api from '../lib/api';

interface WishlistButtonProps {
  productId: string;
  initialInWishlist: boolean;
  slug: string;
}

export function WishlistButton({ productId, initialInWishlist, slug }: WishlistButtonProps) {
  const [inWishlist, setInWishlist] = useState(initialInWishlist);
  const [toggling, setToggling] = useState(false);
  const router = useRouter();

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const handleToggle = async () => {
    if (!token) {
      router.push(`/login?returnUrl=/products/${slug}`);
      return;
    }

    setToggling(true);
    const previousState = inWishlist;
    setInWishlist(!inWishlist);

    try {
      if (inWishlist) {
        await api.removeFromWishlist(token, productId);
      } else {
        await api.toggleWishlist(token, productId);
      }
    } catch {
      setInWishlist(previousState);
    } finally {
      setToggling(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={toggling}
      data-testid="wishlist-button"
      className={clsx(
        'flex w-full items-center justify-center gap-2 rounded-full border p-4',
        'text-sm font-medium transition-colors duration-200',
        inWishlist
          ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40'
          : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:text-black dark:border-neutral-700 dark:bg-transparent dark:text-neutral-400 dark:hover:border-neutral-500 dark:hover:text-white',
        toggling && 'cursor-not-allowed opacity-60',
      )}
    >
      {inWishlist ? (
        <HeartSolid className="h-5 w-5" />
      ) : (
        <HeartOutline className="h-5 w-5" />
      )}
      {inWishlist ? 'Saved' : 'Add to Wishlist'}
    </button>
  );
}
