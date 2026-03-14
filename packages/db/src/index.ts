export { PrismaClient } from '@prisma/client';
export type {
  User,
  Product,
  Category,
  ProductImage,
  PriceTier,
  Cart,
  CartItem,
  Coupon,
  CouponUsage,
  CouponType,
  Address,
  Order,
  OrderItem,
  OrderStatusHistory,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Reseller,
  ResellerStatus,
  Commission,
  CommissionStatus,
  UserRole,
  ChannelType,
  SyncStatus,
  ChannelConnection,
  SyncLog,
} from '@prisma/client';

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
