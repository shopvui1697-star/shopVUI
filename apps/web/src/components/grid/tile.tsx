import clsx from 'clsx';
import Image from 'next/image';
import { formatCurrency } from '@shopvui/shared';

export function GridTileImage({
  isInteractive = true,
  active,
  label,
  src,
  alt,
  priority,
}: {
  isInteractive?: boolean;
  active?: boolean;
  label?: {
    title: string;
    amount: number;
    currencyCode?: string;
    position?: 'bottom' | 'center';
  };
  src?: string;
  alt?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={clsx(
        'group relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg border bg-white hover:border-blue-600 dark:bg-black',
        {
          'border-2 border-blue-600': active,
          'border-neutral-200 dark:border-neutral-800': !active,
        }
      )}
    >
      {src ? (
        <Image
          className={clsx('relative h-full w-full object-contain', {
            'transition-transform duration-300 ease-in-out group-hover:scale-105': isInteractive,
          })}
          fill
          sizes="(min-width: 768px) 33vw, 100vw"
          alt={alt || ''}
          src={src}
          priority={priority}
        />
      ) : (
        <div
          className={clsx('relative h-full w-full bg-neutral-100 dark:bg-neutral-900', {
            'transition-transform duration-300 ease-in-out group-hover:scale-105': isInteractive,
          })}
        />
      )}
      {label ? (
        <Label
          title={label.title}
          amount={label.amount}
          currencyCode={label.currencyCode}
          position={label.position}
        />
      ) : null}
    </div>
  );
}

function Label({
  title,
  amount,
  currencyCode = 'VND',
  position = 'bottom',
}: {
  title: string;
  amount: number;
  currencyCode?: string;
  position?: 'bottom' | 'center';
}) {
  return (
    <div
      className={clsx(
        'absolute z-10 flex w-full',
        {
          'bottom-0 start-0 m-4': position === 'bottom',
          'items-center justify-center lg:px-20 lg:pb-[35%]': position === 'center',
        }
      )}
    >
      <div className="flex items-center rounded-full border bg-white/70 p-1 text-xs font-semibold text-black backdrop-blur-md dark:border-neutral-800 dark:bg-black/70 dark:text-white">
        <h3 className="mr-4 line-clamp-2 flex-grow pl-2 leading-none tracking-tight">
          {title}
        </h3>
        <Price amount={amount} currencyCode={currencyCode} />
      </div>
    </div>
  );
}

function Price({
  amount,
  currencyCode = 'VND',
  className,
}: {
  amount: number;
  currencyCode?: string;
  className?: string;
}) {
  return (
    <p
      className={clsx(
        'flex-none rounded-full bg-blue-600 p-2 text-white',
        className
      )}
    >
      {formatCurrency(amount, currencyCode)}
    </p>
  );
}
