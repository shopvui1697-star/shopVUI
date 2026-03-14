export type ResellerStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'REJECTED';
export type CommissionStatus = 'PENDING' | 'MATURING' | 'APPROVED' | 'PAID' | 'VOIDED';

export interface ResellerRegistration {
  name: string;
  email: string;
  password: string;
  phone?: string;
  socialProfiles?: Record<string, string>;
  reason?: string;
}

export interface ResellerProfile {
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

export interface ResellerBankInfo {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface ResellerDashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCommissionEarned: number;
  totalCommissionPaid: number;
  pendingCommission: number;
  activeCoupons: number;
}

export interface CommissionData {
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

export interface ResellerCouponProposal {
  code: string;
  type: string;
  value?: number;
  maxDiscount?: number;
  minPurchase?: number;
}

export interface ResellerOrderData {
  orderNumber: string;
  date: string;
  total: number;
  status: string;
  commissionAmount: number;
  commissionStatus: CommissionStatus;
}
