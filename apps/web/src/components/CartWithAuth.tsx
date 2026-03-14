'use client';

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CartProvider } from '../contexts/CartContext';

export function CartWithAuth({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  return <CartProvider token={token}>{children}</CartProvider>;
}
