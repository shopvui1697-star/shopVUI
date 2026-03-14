'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

export function NavBar() {
  const { itemCount } = useCart();
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem 2rem',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: 'white',
      }}
    >
      <Link href="/" style={{ fontWeight: 700, fontSize: '1.25rem', textDecoration: 'none', color: '#111827' }}>
        ShopVUI
      </Link>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <Link href="/products" style={{ textDecoration: 'none', color: '#374151' }}>
          Products
        </Link>
        <Link href="/orders" style={{ textDecoration: 'none', color: '#374151' }}>
          Orders
        </Link>
        <Link href="/account/wishlist" style={{ textDecoration: 'none', color: '#374151' }}>
          Wishlist
        </Link>
        <Link href="/account/addresses" style={{ textDecoration: 'none', color: '#374151' }}>
          Addresses
        </Link>
        <Link href="/cart" style={{ textDecoration: 'none', color: '#374151', position: 'relative' }}>
          Cart
          {itemCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-8px',
                right: '-12px',
                backgroundColor: '#ef4444',
                color: 'white',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
              }}
              data-testid="cart-badge"
            >
              {itemCount}
            </span>
          )}
        </Link>
        {isLoading ? null : user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                referrerPolicy="no-referrer"
                style={{ width: 28, height: 28, borderRadius: '50%' }}
              />
            ) : (
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  backgroundColor: '#4f46e5',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            )}
            <span style={{ color: '#374151', fontSize: '0.875rem' }}>{user.name}</span>
            <button
              onClick={handleLogout}
              style={{
                color: '#6b7280',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                padding: 0,
                marginLeft: '0.25rem',
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <Link href="/login" style={{ textDecoration: 'none', color: '#4f46e5', fontWeight: 600 }}>
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
