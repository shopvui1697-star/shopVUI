import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import clsx from 'clsx';
import { AuthProvider } from '../contexts/AuthContext';
import { CartWithAuth } from '../components/CartWithAuth';
import { CouponCapture } from '../components/CouponCapture';
import { Navbar } from '../components/layout/navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'ShopVUI',
  description: 'Voice-powered shopping experience',
  manifest: '/manifest.json',
  themeColor: '#4f46e5',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ShopVUI',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'ShopVUI',
    description: 'Voice-powered shopping experience',
    type: 'website',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'ShopVUI' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={clsx(GeistSans.variable, GeistMono.variable)}>
      <body
        className={clsx(
          'bg-neutral-50 text-black selection:bg-teal-300',
          'dark:bg-neutral-900 dark:text-white dark:selection:bg-pink-500 dark:selection:text-white',
          'antialiased font-sans'
        )}
      >
        <AuthProvider>
          <CartWithAuth>
            <CouponCapture />
            <Navbar />
            <main className="pt-6">{children}</main>
          </CartWithAuth>
        </AuthProvider>
      </body>
    </html>
  );
}
