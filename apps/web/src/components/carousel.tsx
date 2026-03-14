import Link from 'next/link';
import type { Product } from '@shopvui/shared';
import { GridTileImage } from './grid/tile';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function Carousel() {
  let products: Product[] = [];

  try {
    const res = await fetch(`${API_URL}/products?pageSize=10`, {
      next: { revalidate: 60 },
    });

    if (res.ok) {
      const json = (await res.json()) as { data: Product[] };
      products = json.data;
    }
  } catch {
    // Silently fail
  }

  if (!products.length) {
    return null;
  }

  // Triple the array for seamless infinite loop
  const carouselProducts = [...products, ...products, ...products];

  return (
    <div className="w-full overflow-x-auto pb-6 pt-1">
      <ul className="animate-carousel flex gap-4">
        {carouselProducts.map((product, i) => {
          const imageUrl = product.images?.[0]?.url || '';

          return (
            <li
              key={`${product.id}-${i}`}
              className="relative aspect-square h-[30vh] max-h-[275px] w-2/3 flex-none md:w-1/3"
            >
              <Link
                href={`/products/${product.id}`}
                className="relative h-full w-full"
                prefetch={true}
              >
                <GridTileImage
                  src={imageUrl}
                  alt={product.name}
                  label={{
                    title: product.name,
                    amount: product.price,
                  }}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
