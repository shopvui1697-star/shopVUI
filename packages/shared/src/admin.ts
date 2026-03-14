export interface AdminOrderListItem {
  id: string;
  orderNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  channel: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  itemCount: number;
  createdAt: string;
}

export interface AdminOrderDetail extends AdminOrderListItem {
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  couponCode: string | null;
  resellerId: string | null;
  items: {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  address: {
    fullName: string;
    phone: string;
    street: string;
    ward: string;
    district: string;
    province: string;
  } | null;
  statusHistory: {
    status: string;
    note: string | null;
    createdAt: string;
  }[];
  user: { id: string; email: string; name: string | null } | null;
  coupon: { id: string; code: string; type: string } | null;
  reseller: { id: string; name: string } | null;
}

export interface AdminOrderFilters {
  channel?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  paymentStatus?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminProductForm {
  name: string;
  description: string;
  basePrice: number;
  categoryId: string;
  stockQuantity: number;
  sku?: string;
  compareAtPrice?: number;
}

export interface AdminProductListItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  stockQuantity: number;
  categoryName: string;
  isActive: boolean;
  imageUrl: string | null;
  createdAt: string;
}

export interface AdminCouponListItem {
  id: string;
  code: string;
  type: string;
  value: number | null;
  isActive: boolean;
  usageLimit: number | null;
  timesUsed: number;
  isResellerCoupon: boolean;
  resellerName: string | null;
  validFrom: string | null;
  validUntil: string | null;
}

export interface AdminCouponForm {
  code: string;
  type: string;
  value?: number;
  maxDiscount?: number;
  minPurchase?: number;
  usageLimit?: number;
  perUserLimit?: number;
  validFrom?: string;
  validUntil?: string;
  applicableCategory?: string;
  buyQty?: number;
  getQty?: number;
  isActive?: boolean;
}

export interface AdminResellerListItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  orderCount: number;
  totalRevenue: number;
  commissionRate: number | null;
  createdAt: string;
}

export interface AdminPayoutListItem {
  id: string;
  resellerId: string;
  resellerName: string;
  commissionAmount: number;
  status: string;
  orderId: string;
  orderNumber: string;
  couponCode: string;
  createdAt: string;
}

export interface AdminCustomerListItem {
  id: string;
  name: string | null;
  email: string;
  orderCount: number;
  totalSpend: number;
  lastOrderDate: string | null;
  createdAt: string;
}

export interface AdminCustomerDetail extends AdminCustomerListItem {
  avatar: string | null;
  orders: {
    orderNumber: string;
    channel: string;
    status: string;
    total: number;
    createdAt: string;
  }[];
}

export interface AnalyticsRevenueByChannel {
  channel: string;
  revenue: number;
  orderCount: number;
}

export interface AnalyticsRevenueOverTime {
  period: string;
  revenue: number;
  orderCount: number;
}

export interface AnalyticsTopProducts {
  productId: string;
  productName: string;
  unitsSold: number;
  revenue: number;
}

export interface AnalyticsCouponPerformance {
  couponId: string;
  couponCode: string;
  usageCount: number;
  totalDiscountGiven: number;
  ordersInfluenced: number;
}

export interface CsvImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}

export interface OrderStatusTransition {
  from: string;
  to: string;
  note?: string;
}
