export type CouponType = 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING' | 'BUY_X_GET_Y';

export interface CouponValidationResult {
  valid: boolean;
  discount: number;
  message: string;
  type?: CouponType;
}

export interface CouponData {
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
