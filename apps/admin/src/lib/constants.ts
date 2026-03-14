export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
export type Channel = 'WEBSITE' | 'SHOPEE' | 'TIKTOK' | 'FACEBOOK' | 'OTHER';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  SHIPPING: 'Shipping',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned',
};

export const CHANNEL_LABELS: Record<Channel, string> = {
  WEBSITE: 'Website',
  SHOPEE: 'Shopee',
  TIKTOK: 'TikTok',
  FACEBOOK: 'Facebook',
  OTHER: 'Other',
};

export const CHANNEL_COLORS: Record<Channel, string> = {
  WEBSITE: 'bg-blue-100 text-blue-800',
  SHOPEE: 'bg-orange-100 text-orange-800',
  TIKTOK: 'bg-pink-100 text-pink-800',
  FACEBOOK: 'bg-indigo-100 text-indigo-800',
  OTHER: 'bg-gray-100 text-gray-800',
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  SHIPPING: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  RETURNED: 'bg-gray-100 text-gray-800',
};

export const VALID_NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPING', 'CANCELLED'],
  SHIPPING: ['DELIVERED', 'RETURNED'],
  DELIVERED: ['RETURNED'],
  CANCELLED: [],
  RETURNED: [],
};
