'use client';

import { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import Link from 'next/link';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

interface AddToCartButtonProps {
  productId: string;
  inStock: boolean;
}

function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white" />
    </span>
  );
}

export function AddToCartButton({ productId, inStock }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const { addItem } = useCart();
  const { token } = useAuth();

  const handleAdd = async () => {
    setAdding(true);
    try {
      await addItem(productId, quantity);
    } finally {
      setAdding(false);
    }
  };

  if (!token) {
    return (
      <Link
        href={`/login?returnUrl=/products/${productId}`}
        className={clsx(
          'flex w-full items-center justify-center gap-2 rounded-full',
          'bg-blue-600 p-4 text-sm font-medium uppercase tracking-wide text-white',
          'opacity-90 hover:opacity-100',
          'transition-opacity duration-200',
        )}
        data-testid="add-to-cart"
      >
        Sign in to Add to Cart
      </Link>
    );
  }

  if (!inStock) {
    return (
      <button
        disabled
        className={clsx(
          'flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-full',
          'bg-neutral-400 p-4 text-sm font-medium uppercase tracking-wide text-white opacity-60',
          'dark:bg-neutral-700',
        )}
        data-testid="add-to-cart"
      >
        Out of Stock
      </button>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3" data-testid="add-to-cart">
      <div className="flex items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-700">
        <button
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          className="px-4 py-2 text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white"
          aria-label="Decrease quantity"
        >
          &minus;
        </button>
        <span className="min-w-[3rem] text-center text-sm font-medium text-black dark:text-white">
          {quantity}
        </span>
        <button
          onClick={() => setQuantity(quantity + 1)}
          className="px-4 py-2 text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>

      <button
        onClick={handleAdd}
        disabled={adding}
        className={clsx(
          'flex w-full items-center justify-center gap-2 rounded-full',
          'bg-blue-600 p-4 text-sm font-medium uppercase tracking-wide text-white',
          'opacity-90 hover:opacity-100',
          'transition-opacity duration-200',
          adding && 'cursor-not-allowed opacity-60',
        )}
        data-testid="add-to-cart-button"
      >
        {adding ? (
          <LoadingDots />
        ) : (
          <>
            <PlusIcon className="h-5 w-5" />
            Add to Cart
          </>
        )}
      </button>
    </div>
  );
}
