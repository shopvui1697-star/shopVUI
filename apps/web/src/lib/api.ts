import type {
  Product,
  Category,
  PaginatedResponse,
  CartData,
  CouponValidationResult,
  OrderSummary,
  OrderDetail,
  AddressData,
  PlaceOrderResponse,
  PriceTierData,
  PaymentMethod,
} from '@shopvui/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function getProducts(params?: {
  search?: string;
  categoryId?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<Product>> {
  const url = new URL(`${API_URL}/products`);
  if (params?.search) url.searchParams.set('search', params.search);
  if (params?.categoryId) url.searchParams.set('categoryId', params.categoryId);
  if (params?.page) url.searchParams.set('page', String(params.page));
  if (params?.pageSize) url.searchParams.set('pageSize', String(params.pageSize));

  const res = await fetch(url.toString(), { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);
  return res.json();
}

export async function getProduct(id: string): Promise<Product | null> {
  const res = await fetch(`${API_URL}/products/${id}`, { next: { revalidate: 60 } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch product: ${res.status}`);
  return res.json();
}

export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${API_URL}/categories`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`);
  return res.json();
}

// --- Authenticated API helpers ---

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

// Price Tiers
export async function getPriceTiers(productId: string): Promise<PriceTierData[]> {
  const res = await fetch(`${API_URL}/products/${productId}/price-tiers`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return [];
  return res.json();
}

// Cart
export async function getCart(token: string): Promise<CartData> {
  const res = await fetch(`${API_URL}/cart`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Failed to fetch cart');
  return res.json();
}

export async function addToCart(
  token: string,
  productId: string,
  quantity: number,
): Promise<CartData> {
  const res = await fetch(`${API_URL}/cart/items`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ productId, quantity }),
  });
  if (!res.ok) throw new Error('Failed to add to cart');
  return res.json();
}

export async function updateCartItem(
  token: string,
  itemId: string,
  quantity: number,
): Promise<CartData> {
  const res = await fetch(`${API_URL}/cart/items/${itemId}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ quantity }),
  });
  if (!res.ok) throw new Error('Failed to update cart');
  return res.json();
}

export async function removeCartItem(token: string, itemId: string): Promise<CartData> {
  const res = await fetch(`${API_URL}/cart/items/${itemId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to remove from cart');
  return res.json();
}

export async function mergeCart(
  token: string,
  items: Array<{ productId: string; quantity: number }>,
): Promise<CartData> {
  const res = await fetch(`${API_URL}/cart/merge`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error('Failed to merge cart');
  return res.json();
}

// Coupons
export async function validateCoupon(
  token: string,
  code: string,
  cartItems: any[],
  subtotal: number,
): Promise<CouponValidationResult> {
  const res = await fetch(`${API_URL}/coupons/validate`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ code, cartItems, subtotal }),
  });
  if (!res.ok) throw new Error('Failed to validate coupon');
  return res.json();
}

// Addresses
export async function getAddresses(token: string): Promise<AddressData[]> {
  const res = await fetch(`${API_URL}/addresses`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Failed to fetch addresses');
  return res.json();
}

export async function createAddress(
  token: string,
  data: Omit<AddressData, 'id'>,
): Promise<AddressData> {
  const res = await fetch(`${API_URL}/addresses`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create address');
  return res.json();
}

export async function updateAddress(
  token: string,
  id: string,
  data: Partial<AddressData>,
): Promise<AddressData> {
  const res = await fetch(`${API_URL}/addresses/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update address');
  return res.json();
}

export async function deleteAddress(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/addresses/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to delete address');
}

export async function setDefaultAddress(token: string, id: string): Promise<AddressData> {
  const res = await fetch(`${API_URL}/addresses/${id}/default`, {
    method: 'PATCH',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to set default address');
  return res.json();
}

// Checkout
export async function previewCheckout(
  token: string,
  couponCode?: string,
): Promise<CartData & { couponMessage?: string }> {
  const res = await fetch(`${API_URL}/checkout/preview`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ couponCode }),
  });
  if (!res.ok) throw new Error('Failed to preview checkout');
  return res.json();
}

export async function placeOrder(
  token: string,
  data: { addressId: string; paymentMethod: PaymentMethod; couponCode?: string },
): Promise<PlaceOrderResponse> {
  const res = await fetch(`${API_URL}/checkout/place-order`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to place order');
  }
  return res.json();
}

// Orders
export async function getOrders(
  token: string,
  page = 1,
  pageSize = 10,
): Promise<PaginatedResponse<OrderSummary>> {
  const res = await fetch(`${API_URL}/orders?page=${page}&pageSize=${pageSize}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

export async function getOrder(token: string, orderNumber: string): Promise<OrderDetail> {
  const res = await fetch(`${API_URL}/orders/${orderNumber}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to fetch order');
  return res.json();
}

export async function cancelOrder(token: string, orderNumber: string): Promise<void> {
  const res = await fetch(`${API_URL}/orders/${orderNumber}/cancel`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to cancel order');
  }
}

// Wishlist
export async function toggleWishlist(token: string, productId: string): Promise<{ inWishlist: boolean }> {
  const res = await fetch(`${API_URL}/wishlist/${productId}`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to toggle wishlist');
  return res.json();
}

export async function removeFromWishlist(token: string, productId: string): Promise<void> {
  const res = await fetch(`${API_URL}/wishlist/${productId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to remove from wishlist');
}

export async function getWishlist(token: string): Promise<any[]> {
  const res = await fetch(`${API_URL}/wishlist`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Failed to fetch wishlist');
  return res.json();
}

export async function checkWishlist(token: string, productId: string): Promise<{ inWishlist: boolean }> {
  const res = await fetch(`${API_URL}/wishlist/check/${productId}`, { headers: authHeaders(token) });
  if (!res.ok) return { inWishlist: false };
  return res.json();
}

// --- Reseller API ---

export async function resellerRegister(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  socialProfiles?: Record<string, string>;
  reason?: string;
}): Promise<{ message: string; resellerId: string }> {
  const res = await fetch(`${API_URL}/resellers/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Registration failed');
  }
  return res.json();
}

export async function resellerLogin(email: string, password: string): Promise<{ accessToken: string }> {
  const res = await fetch(`${API_URL}/resellers/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Login failed');
  }
  return res.json();
}

export async function getResellerProfile(token: string) {
  const res = await fetch(`${API_URL}/resellers/me`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
}

export async function updateResellerProfile(token: string, data: any) {
  const res = await fetch(`${API_URL}/resellers/me`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update profile');
  return res.json();
}

export async function getResellerDashboard(token: string) {
  const res = await fetch(`${API_URL}/resellers/me/dashboard`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Failed to fetch dashboard');
  return res.json();
}

export async function getResellerCoupons(token: string) {
  const res = await fetch(`${API_URL}/resellers/me/coupons`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Failed to fetch coupons');
  return res.json();
}

export async function proposeResellerCoupon(token: string, code: string) {
  const res = await fetch(`${API_URL}/resellers/me/coupons`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ code }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to propose coupon');
  }
  return res.json();
}

export async function getResellerCommissions(token: string, status?: string, page = 1) {
  const url = new URL(`${API_URL}/resellers/me/commissions`);
  if (status) url.searchParams.set('status', status);
  url.searchParams.set('page', String(page));
  const res = await fetch(url.toString(), { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Failed to fetch commissions');
  return res.json();
}
