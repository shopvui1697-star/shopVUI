export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
export type PaymentMethod = 'VNPAY' | 'MOMO' | 'BANK_TRANSFER' | 'COD';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';

export interface OrderItemDetail {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  note: string | null;
  createdAt: string;
}

export interface OrderSummary {
  orderNumber: string;
  date: string;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  itemCount: number;
}

export interface OrderDetail extends OrderSummary {
  items: OrderItemDetail[];
  address: import('./address.js').AddressData;
  couponCode: string | null;
  discountAmount: number;
  shippingFee: number;
  subtotal: number;
  statusHistory: StatusHistoryEntry[];
}

export interface PlaceOrderRequest {
  addressId: string;
  paymentMethod: PaymentMethod;
  couponCode?: string;
}

export interface PlaceOrderResponse {
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number;
  redirectUrl?: string;
}
