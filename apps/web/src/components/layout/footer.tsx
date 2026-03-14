import Link from 'next/link';
import clsx from 'clsx';

const footerLinks = [
  { href: '/products', label: 'Products' },
  { href: '/orders', label: 'Orders' },
];

export function Footer() {
  return (
    <footer
      className={clsx(
        'border-t',
        'border-neutral-200 bg-white',
        'dark:border-neutral-800 dark:bg-neutral-900'
      )}
    >
      <div className="mx-auto flex max-w-screen-2xl flex-col items-center gap-4 px-4 py-6 sm:flex-row sm:justify-between lg:px-6">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold text-black dark:text-white">ShopVUI</span>
          <nav className="flex gap-4">
            {footerLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'text-sm text-neutral-500 underline-offset-4',
                  'hover:text-black hover:underline',
                  'dark:text-neutral-400 dark:hover:text-neutral-300'
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          &copy; {new Date().getFullYear()} ShopVUI. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
