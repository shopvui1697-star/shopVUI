export interface CartItemData {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  tierApplied: string | null;
}

export interface CartData {
  items: CartItemData[];
  subtotal: number;
  couponDiscount: number;
  shippingFee: number;
  total: number;
  couponCode?: string;
}

export interface GuestCartItem {
  productId: string;
  quantity: number;
}
