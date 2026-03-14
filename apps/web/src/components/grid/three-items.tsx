import Link from 'next/link';
import type { Product } from '@shopvui/shared';
import { GridTileImage } from './tile';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function ThreeItemGridItem({
  item,
  size,
  priority,
}: {
  item: Product;
  size: 'full' | 'half';
  priority?: boolean;
}) {
  const imageUrl = item.images?.[0]?.url || '';

  return (
    <div
      className={
        size === 'full'
          ? 'md:col-span-4 md:row-span-2'
          : 'md:col-span-2 md:row-span-1'
      }
    >
      <Link
        className="relative block aspect-square h-full w-full"
        href={`/products/${item.id}`}
        prefetch={true}
      >
        <GridTileImage
          src={imageUrl}
          alt={item.name}
          label={{
            title: item.name,
            amount: item.price,
            position: size === 'full' ? 'center' : 'bottom',
          }}
          priority={priority}
        />
      </Link>
    </div>
  );
}

export async function ThreeItemGrid() {
  let products: Product[] = [];

  try {
    const res = await fetch(`${API_URL}/products?pageSize=3`, {
      next: { revalidate: 60 },
    });

    if (res.ok) {
      const json = (await res.json()) as { data: Product[] };
      products = json.data;
    }
  } catch {
    // Silently fail -- homepage still renders
  }

  if (!products.length) {
    return null;
  }

  const [firstProduct, secondProduct, thirdProduct] = products;

  return (
    <section className="mx-auto grid max-w-screen-2xl gap-4 px-4 pb-4 md:grid-cols-6 md:grid-rows-2 lg:max-h-[calc(100vh-200px)]">
      {firstProduct ? (
        <ThreeItemGridItem item={firstProduct} size="full" priority />
      ) : null}
      {secondProduct ? (
        <ThreeItemGridItem item={secondProduct} size="half" priority />
      ) : null}
      {thirdProduct ? (
        <ThreeItemGridItem item={thirdProduct} size="half" />
      ) : null}
    </section>
  );
}
