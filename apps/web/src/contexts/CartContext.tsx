'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { CartData, GuestCartItem } from '@shopvui/shared';
import * as api from '../lib/api';

const GUEST_CART_KEY = 'shopvui_guest_cart';

interface CartContextValue {
  cart: CartData | null;
  itemCount: number;
  isLoading: boolean;
  addItem: (productId: string, quantity: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue>({
  cart: null,
  itemCount: 0,
  isLoading: false,
  addItem: async () => {},
  updateItem: async () => {},
  removeItem: async () => {},
  refresh: async () => {},
});

export function useCart() {
  return useContext(CartContext);
}

function getGuestCart(): GuestCartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]');
  } catch {
    return [];
  }
}

function setGuestCart(items: GuestCartItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

function clearGuestCart() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(GUEST_CART_KEY);
}

export function CartProvider({
  children,
  token,
}: {
  children: React.ReactNode;
  token: string | null;
}) {
  const [cart, setCart] = useState<CartData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) {
      // Guest mode: build cart from localStorage
      const guestItems = getGuestCart();
      const subtotal = 0; // Guest cart doesn't have server-computed prices
      setCart({
        items: guestItems.map((g) => ({
          id: g.productId,
          productId: g.productId,
          productName: '',
          productImage: null,
          quantity: g.quantity,
          unitPrice: 0,
          subtotal: 0,
          tierApplied: null,
        })),
        subtotal,
        couponDiscount: 0,
        shippingFee: 0,
        total: subtotal,
      });
      return;
    }

    setIsLoading(true);
    try {
      const data = await api.getCart(token);
      setCart(data);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Merge guest cart on login
  useEffect(() => {
    if (token) {
      const guestItems = getGuestCart();
      if (guestItems.length > 0) {
        api.mergeCart(token, guestItems).then((data) => {
          setCart(data);
          clearGuestCart();
        }).catch(() => {
          // Fall back to just fetching cart
          refresh();
        });
      } else {
        refresh();
      }
    } else {
      refresh();
    }
  }, [token, refresh]);

  const addItem = useCallback(
    async (productId: string, quantity: number) => {
      if (!token) {
        const items = getGuestCart();
        const existing = items.find((i) => i.productId === productId);
        if (existing) {
          existing.quantity += quantity;
        } else {
          items.push({ productId, quantity });
        }
        setGuestCart(items);
        await refresh();
        return;
      }
      setIsLoading(true);
      try {
        const data = await api.addToCart(token, productId, quantity);
        setCart(data);
      } finally {
        setIsLoading(false);
      }
    },
    [token, refresh],
  );

  const updateItem = useCallback(
    async (itemId: string, quantity: number) => {
      if (!token) {
        const items = getGuestCart();
        if (quantity <= 0) {
          setGuestCart(items.filter((i) => i.productId !== itemId));
        } else {
          const item = items.find((i) => i.productId === itemId);
          if (item) item.quantity = quantity;
          setGuestCart(items);
        }
        await refresh();
        return;
      }
      setIsLoading(true);
      try {
        const data = await api.updateCartItem(token, itemId, quantity);
        setCart(data);
      } finally {
        setIsLoading(false);
      }
    },
    [token, refresh],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!token) {
        const items = getGuestCart().filter((i) => i.productId !== itemId);
        setGuestCart(items);
        await refresh();
        return;
      }
      setIsLoading(true);
      try {
        const data = await api.removeCartItem(token, itemId);
        setCart(data);
      } finally {
        setIsLoading(false);
      }
    },
    [token, refresh],
  );

  const itemCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  return (
    <CartContext.Provider value={{ cart, itemCount, isLoading, addItem, updateItem, removeItem, refresh }}>
      {children}
    </CartContext.Provider>
  );
}
