interface AppConfig {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
}
interface ApiResponse<T> {
    data: T;
    success: boolean;
    message?: string;
    timestamp: string;
}

interface AuthUser {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
    role?: string;
}
interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
interface AuthSession {
    user: AuthUser;
    tokens: AuthTokens;
}
interface GoogleProfile {
    googleId: string;
    email: string;
    name: string;
    avatar: string | null;
}

interface ProductImage {
    id: string;
    url: string;
    alt: string | null;
    sortOrder: number;
}
interface Product {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    compareAtPrice: number | null;
    sku: string;
    stockQuantity: number;
    categoryId: string;
    category?: Category;
    images: ProductImage[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    parentId: string | null;
    parent?: Category;
    children?: Category[];
    _count?: {
        products: number;
    };
}
interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

interface PriceTierData {
    id: string;
    minQty: number;
    maxQty: number | null;
    price: number;
}

interface CartItemData {
    id: string;
    productId: string;
    productName: string;
    productImage: string | null;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    tierApplied: string | null;
}
interface CartData {
    items: CartItemData[];
    subtotal: number;
    couponDiscount: number;
    shippingFee: number;
    total: number;
    couponCode?: string;
}
interface GuestCartItem {
    productId: string;
    quantity: number;
}

type CouponType = 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING' | 'BUY_X_GET_Y';
interface CouponValidationResult {
    valid: boolean;
    discount: number;
    message: string;
    type?: CouponType;
}
interface CouponData {
    id: string;
    code: string;
    type: CouponType;
    value: number | null;
    maxDiscount: number | null;
    minPurchase: number | null;
    validFrom: string | null;
    validUntil: string | null;
    isActive: boolean;
}

interface AddressData {
    id: string;
    fullName: string;
    phone: string;
    street: string;
    ward: string;
    district: string;
    province: string;
    isDefault: boolean;
}
interface CreateAddressInput {
    fullName: string;
    phone: string;
    street: string;
    ward: string;
    district: string;
    province: string;
    isDefault?: boolean;
}
interface UpdateAddressInput extends Partial<CreateAddressInput> {
}

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
type PaymentMethod = 'VNPAY' | 'MOMO' | 'BANK_TRANSFER' | 'COD';
type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';
interface OrderItemDetail {
    id: string;
    productId: string;
    productName: string;
    productImage: string | null;
    quantity: number;
    unitPrice: number;
    subtotal: number;
}
interface StatusHistoryEntry {
    status: OrderStatus;
    note: string | null;
    createdAt: string;
}
interface OrderSummary {
    orderNumber: string;
    date: string;
    total: number;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    itemCount: number;
}
interface OrderDetail extends OrderSummary {
    items: OrderItemDetail[];
    address: AddressData;
    couponCode: string | null;
    discountAmount: number;
    shippingFee: number;
    subtotal: number;
    statusHistory: StatusHistoryEntry[];
}
interface PlaceOrderRequest {
    addressId: string;
    paymentMethod: PaymentMethod;
    couponCode?: string;
}
interface PlaceOrderResponse {
    orderNumber: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    total: number;
    redirectUrl?: string;
}

type ResellerStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'REJECTED';
type CommissionStatus = 'PENDING' | 'MATURING' | 'APPROVED' | 'PAID' | 'VOIDED';
interface ResellerRegistration {
    name: string;
    email: string;
    password: string;
    phone?: string;
    socialProfiles?: Record<string, string>;
    reason?: string;
}
interface ResellerProfile {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    socialProfiles: Record<string, string> | null;
    status: ResellerStatus;
    bankInfo: ResellerBankInfo | null;
    defaultCommissionType: string | null;
    defaultCommissionValue: number | null;
    createdAt: string;
}
interface ResellerBankInfo {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
}
interface ResellerDashboardStats {
    totalOrders: number;
    totalRevenue: number;
    totalCommissionEarned: number;
    totalCommissionPaid: number;
    pendingCommission: number;
    activeCoupons: number;
}
interface CommissionData {
    id: string;
    orderId: string;
    orderNumber: string;
    couponCode: string;
    orderTotal: number;
    commissionAmount: number;
    status: CommissionStatus;
    orderDeliveredAt: string | null;
    maturityDate: string | null;
    approvedAt: string | null;
    paidAt: string | null;
    voidedAt: string | null;
    voidReason: string | null;
    createdAt: string;
}
interface ResellerCouponProposal {
    code: string;
    type: string;
    value?: number;
    maxDiscount?: number;
    minPurchase?: number;
}
interface ResellerOrderData {
    orderNumber: string;
    date: string;
    total: number;
    status: string;
    commissionAmount: number;
    commissionStatus: CommissionStatus;
}

interface AdminOrderListItem {
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
interface AdminOrderDetail extends AdminOrderListItem {
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
    user: {
        id: string;
        email: string;
        name: string | null;
    } | null;
    coupon: {
        id: string;
        code: string;
        type: string;
    } | null;
    reseller: {
        id: string;
        name: string;
    } | null;
}
interface AdminOrderFilters {
    channel?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    paymentStatus?: string;
    search?: string;
    page?: number;
    pageSize?: number;
}
interface AdminProductForm {
    name: string;
    description: string;
    basePrice: number;
    categoryId: string;
    stockQuantity: number;
    sku?: string;
    compareAtPrice?: number;
}
interface AdminProductListItem {
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
interface AdminCouponListItem {
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
interface AdminCouponForm {
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
interface AdminResellerListItem {
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
interface AdminPayoutListItem {
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
interface AdminCustomerListItem {
    id: string;
    name: string | null;
    email: string;
    orderCount: number;
    totalSpend: number;
    lastOrderDate: string | null;
    createdAt: string;
}
interface AdminCustomerDetail extends AdminCustomerListItem {
    avatar: string | null;
    orders: {
        orderNumber: string;
        channel: string;
        status: string;
        total: number;
        createdAt: string;
    }[];
}
interface AnalyticsRevenueByChannel {
    channel: string;
    revenue: number;
    orderCount: number;
}
interface AnalyticsRevenueOverTime {
    period: string;
    revenue: number;
    orderCount: number;
}
interface AnalyticsTopProducts {
    productId: string;
    productName: string;
    unitsSold: number;
    revenue: number;
}
interface AnalyticsCouponPerformance {
    couponId: string;
    couponCode: string;
    usageCount: number;
    totalDiscountGiven: number;
    ordersInfluenced: number;
}
interface CsvImportResult {
    imported: number;
    skipped: number;
    errors: {
        row: number;
        reason: string;
    }[];
}
interface OrderStatusTransition {
    from: string;
    to: string;
    note?: string;
}

type NotificationType = 'ORDER_STATUS' | 'PAYMENT' | 'COMMISSION' | 'SYSTEM' | 'ADMIN_ALERT' | 'RESELLER' | 'CONVERSATION';
interface NotificationData {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    isRead: boolean;
    metadata: Record<string, unknown> | null;
    templateId: string | null;
    autoShow: boolean;
    createdAt: string;
}
interface NotificationTemplateData {
    id: string;
    name: string;
    title: string;
    body: string;
    type: NotificationType;
    autoShow: boolean;
    createdAt: string;
    updatedAt: string;
}
interface UnreadCountResponse {
    count: number;
}

declare function formatCurrency(amount: number, currency: string): string;

export { type AddressData, type AdminCouponForm, type AdminCouponListItem, type AdminCustomerDetail, type AdminCustomerListItem, type AdminOrderDetail, type AdminOrderFilters, type AdminOrderListItem, type AdminPayoutListItem, type AdminProductForm, type AdminProductListItem, type AdminResellerListItem, type AnalyticsCouponPerformance, type AnalyticsRevenueByChannel, type AnalyticsRevenueOverTime, type AnalyticsTopProducts, type ApiResponse, type AppConfig, type AuthSession, type AuthTokens, type AuthUser, type CartData, type CartItemData, type Category, type CommissionData, type CommissionStatus, type CouponData, type CouponType, type CouponValidationResult, type CreateAddressInput, type CsvImportResult, type GoogleProfile, type GuestCartItem, type NotificationData, type NotificationTemplateData, type NotificationType, type OrderDetail, type OrderItemDetail, type OrderStatus, type OrderStatusTransition, type OrderSummary, type PaginatedResponse, type PaymentMethod, type PaymentStatus, type PlaceOrderRequest, type PlaceOrderResponse, type PriceTierData, type Product, type ProductImage, type ResellerBankInfo, type ResellerCouponProposal, type ResellerDashboardStats, type ResellerOrderData, type ResellerProfile, type ResellerRegistration, type ResellerStatus, type StatusHistoryEntry, type UnreadCountResponse, type UpdateAddressInput, formatCurrency };
