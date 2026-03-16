export { PrismaClient } from '@prisma/client';
export type { User, Product, Category, ProductImage, PriceTier, Cart, CartItem, Coupon, CouponUsage, CouponType, Address, Order, OrderItem, OrderStatusHistory, OrderStatus, PaymentMethod, PaymentStatus, Reseller, ResellerStatus, Commission, CommissionStatus, UserRole, ChannelType, SyncStatus, ChannelConnection, SyncLog, } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
export declare const prisma: PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
