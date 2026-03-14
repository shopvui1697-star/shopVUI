import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Categories
  const electronics = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: { name: 'Electronics', slug: 'electronics', description: 'Gadgets and devices' },
  });

  const clothing = await prisma.category.upsert({
    where: { slug: 'clothing' },
    update: {},
    create: { name: 'Clothing', slug: 'clothing', description: 'Apparel and fashion' },
  });

  const home = await prisma.category.upsert({
    where: { slug: 'home' },
    update: {},
    create: { name: 'Home', slug: 'home', description: 'Home and living' },
  });

  // Subcategories
  const headphones = await prisma.category.upsert({
    where: { slug: 'headphones' },
    update: {},
    create: { name: 'Headphones', slug: 'headphones', description: 'Audio headphones', parentId: electronics.id },
  });

  const shoes = await prisma.category.upsert({
    where: { slug: 'shoes' },
    update: {},
    create: { name: 'Shoes', slug: 'shoes', description: 'Footwear', parentId: clothing.id },
  });

  const kitchen = await prisma.category.upsert({
    where: { slug: 'kitchen' },
    update: {},
    create: { name: 'Kitchen', slug: 'kitchen', description: 'Kitchen essentials', parentId: home.id },
  });

  // Products with images
  const products = [
    {
      name: 'Wireless Bluetooth Headphones',
      slug: 'wireless-bluetooth-headphones',
      description: 'Premium over-ear wireless headphones with noise cancellation and 30-hour battery life.',
      price: 7999,
      compareAtPrice: 9999,
      sku: 'ELEC-HP-001',
      stockQuantity: 25,
      categoryId: headphones.id,
      images: [
        { url: 'https://placehold.co/400x400/1a1a2e/eee?text=Headphones+1', alt: 'Wireless headphones front view', sortOrder: 0 },
        { url: 'https://placehold.co/400x400/1a1a2e/eee?text=Headphones+2', alt: 'Wireless headphones side view', sortOrder: 1 },
      ],
    },
    {
      name: 'USB-C Earbuds',
      slug: 'usb-c-earbuds',
      description: 'Compact in-ear earbuds with USB-C connectivity and built-in microphone.',
      price: 2499,
      sku: 'ELEC-EB-001',
      stockQuantity: 50,
      categoryId: headphones.id,
      images: [
        { url: 'https://placehold.co/400x400/16213e/eee?text=Earbuds', alt: 'USB-C earbuds', sortOrder: 0 },
      ],
    },
    {
      name: 'Smart Watch Pro',
      slug: 'smart-watch-pro',
      description: 'Feature-rich smartwatch with health monitoring, GPS, and 5-day battery life.',
      price: 19999,
      compareAtPrice: 24999,
      sku: 'ELEC-SW-001',
      stockQuantity: 8,
      categoryId: electronics.id,
      images: [
        { url: 'https://placehold.co/400x400/0f3460/eee?text=SmartWatch', alt: 'Smart Watch Pro', sortOrder: 0 },
        { url: 'https://placehold.co/400x400/0f3460/eee?text=SmartWatch+Back', alt: 'Smart Watch Pro back', sortOrder: 1 },
      ],
    },
    {
      name: 'Portable Speaker',
      slug: 'portable-speaker',
      description: 'Waterproof portable Bluetooth speaker with 360-degree sound.',
      price: 4999,
      sku: 'ELEC-SP-001',
      stockQuantity: 0,
      categoryId: electronics.id,
      images: [
        { url: 'https://placehold.co/400x400/533483/eee?text=Speaker', alt: 'Portable speaker', sortOrder: 0 },
      ],
    },
    {
      name: 'Red Running Sneakers',
      slug: 'red-running-sneakers',
      description: 'Lightweight running shoes with cushioned sole and breathable mesh upper.',
      price: 8999,
      compareAtPrice: 11999,
      sku: 'CLTH-SH-001',
      stockQuantity: 15,
      categoryId: shoes.id,
      images: [
        { url: 'https://placehold.co/400x400/e94560/eee?text=Red+Sneakers', alt: 'Red running sneakers', sortOrder: 0 },
        { url: 'https://placehold.co/400x400/e94560/eee?text=Red+Sneakers+Side', alt: 'Red running sneakers side', sortOrder: 1 },
        { url: 'https://placehold.co/400x400/e94560/eee?text=Red+Sneakers+Sole', alt: 'Red running sneakers sole', sortOrder: 2 },
      ],
    },
    {
      name: 'Classic Leather Boots',
      slug: 'classic-leather-boots',
      description: 'Handcrafted leather boots with durable rubber sole. Perfect for all seasons.',
      price: 14999,
      sku: 'CLTH-SH-002',
      stockQuantity: 3,
      categoryId: shoes.id,
      images: [
        { url: 'https://placehold.co/400x400/2b2d42/eee?text=Leather+Boots', alt: 'Classic leather boots', sortOrder: 0 },
      ],
    },
    {
      name: 'Cotton T-Shirt Pack',
      slug: 'cotton-tshirt-pack',
      description: 'Pack of 3 premium cotton t-shirts in black, white, and grey.',
      price: 3499,
      sku: 'CLTH-TS-001',
      stockQuantity: 100,
      categoryId: clothing.id,
      images: [
        { url: 'https://placehold.co/400x400/8d99ae/eee?text=T-Shirts', alt: 'Cotton t-shirt pack', sortOrder: 0 },
      ],
    },
    {
      name: 'Chef Knife Set',
      slug: 'chef-knife-set',
      description: 'Professional 5-piece stainless steel knife set with wooden block.',
      price: 12999,
      compareAtPrice: 16999,
      sku: 'HOME-KN-001',
      stockQuantity: 12,
      categoryId: kitchen.id,
      images: [
        { url: 'https://placehold.co/400x400/d4a373/eee?text=Knife+Set', alt: 'Chef knife set', sortOrder: 0 },
        { url: 'https://placehold.co/400x400/d4a373/eee?text=Knife+Detail', alt: 'Chef knife detail', sortOrder: 1 },
      ],
    },
    {
      name: 'Ceramic Coffee Mug',
      slug: 'ceramic-coffee-mug',
      description: 'Handmade ceramic mug with a 350ml capacity. Microwave and dishwasher safe.',
      price: 1499,
      sku: 'HOME-MG-001',
      stockQuantity: 45,
      categoryId: kitchen.id,
      images: [
        { url: 'https://placehold.co/400x400/ccd5ae/333?text=Coffee+Mug', alt: 'Ceramic coffee mug', sortOrder: 0 },
      ],
    },
    {
      name: 'Scented Candle Collection',
      slug: 'scented-candle-collection',
      description: 'Set of 4 soy wax candles in lavender, vanilla, cedar, and ocean breeze.',
      price: 2999,
      sku: 'HOME-CN-001',
      stockQuantity: 30,
      categoryId: home.id,
      images: [
        { url: 'https://placehold.co/400x400/fefae0/333?text=Candles', alt: 'Scented candle collection', sortOrder: 0 },
      ],
    },
    {
      name: 'Throw Blanket',
      slug: 'throw-blanket',
      description: 'Ultra-soft fleece throw blanket. 150cm x 200cm. Machine washable.',
      price: 3999,
      compareAtPrice: 5499,
      sku: 'HOME-BL-001',
      stockQuantity: 0,
      categoryId: home.id,
      images: [
        { url: 'https://placehold.co/400x400/faedcd/333?text=Blanket', alt: 'Throw blanket', sortOrder: 0 },
      ],
    },
    {
      name: 'Desk Organizer',
      slug: 'desk-organizer',
      description: 'Bamboo desk organizer with compartments for pens, phone, and accessories.',
      price: 2499,
      sku: 'HOME-DO-001',
      stockQuantity: 20,
      categoryId: home.id,
      images: [
        { url: 'https://placehold.co/400x400/d5c4a1/333?text=Desk+Organizer', alt: 'Desk organizer', sortOrder: 0 },
      ],
    },
  ];

  for (const { images, ...productData } of products) {
    const product = await prisma.product.upsert({
      where: { sku: productData.sku },
      update: {},
      create: productData,
    });

    const existingImages = await prisma.productImage.count({
      where: { productId: product.id },
    });

    if (existingImages === 0) {
      await prisma.productImage.createMany({
        data: images.map((img) => ({ ...img, productId: product.id })),
      });
    }
  }

  console.log('Seed completed: 6 categories, 12 products with images');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
