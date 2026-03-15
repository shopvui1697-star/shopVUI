import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import clsx from 'clsx';
import { AuthProvider } from '../contexts/AuthContext';
import { CartWithAuth } from '../components/CartWithAuth';
import { CouponCapture } from '../components/CouponCapture';
import { InstallPrompt } from '../components/InstallPrompt';
import { Navbar } from '../components/layout/navbar';
import { ThemeProvider } from '../components/ThemeProvider';
import { QueryProvider } from '../components/QueryProvider';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#4f46e5',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  title: 'ShopVUI',
  description: 'Voice-powered shopping experience',
  manifest: '/manifest.json',
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={clsx(GeistSans.variable, GeistMono.variable)} suppressHydrationWarning>
      <body
        className={clsx(
          'bg-neutral-50 text-black selection:bg-teal-300',
          'dark:bg-neutral-900 dark:text-white dark:selection:bg-pink-500 dark:selection:text-white',
          'antialiased font-sans'
        )}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            <QueryProvider>
              <AuthProvider>
                <CartWithAuth>
                  <CouponCapture />
                  <Navbar />
                  <InstallPrompt />
                  <main className="pt-6">{children}</main>
                </CartWithAuth>
              </AuthProvider>
            </QueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
