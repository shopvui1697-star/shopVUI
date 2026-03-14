# Architecture Plan: 0004 - Full Customer E-Commerce Flow

## 1. Architecture Overview

This increment adds the complete customer purchase journey on top of the existing product catalog (0003) and auth system (0002). The architecture follows NestJS module conventions with server-authoritative price computation, a hybrid cart strategy, and webhook-based payment integration.

```
 Browser (Next.js 15 App Router)
 +-----------+------------------+------------------+
 | Cart Page | Checkout Page    | Orders Page      |
 | (client   | (server comp +   | (server comp)    |
 |  state +  |  client form)    |                  |
 |  API sync)|                  |                  |
 +-----+-----+--------+---------+--------+---------+
       |               |                 |
       v               v                 v
 NestJS API (port 4000)
 +----------+----------+-----------+----------+----------+
 | Cart     | Price    | Coupon    | Checkout | Order    |
 | Module   | Engine   | Module    | Module   | Module   |
 +----------+----------+-----------+----------+----------+
 | Address Module                  | Payment Module      |
 +--------------------------------+---------------------+
       |
       v
 PostgreSQL 16 (Prisma ORM)
 +----------+----------+-----------+----------+----------+
 | Cart     | PriceTier| Coupon    | Order    | Address  |
 | CartItem |          | CouponUse | OrderItem|          |
 +----------+----------+-----------+----------+----------+
```

## 2. Database Schema Design

### 2.1 New Models

All models follow existing conventions: `cuid()` IDs, `@@map("snake_case")` tables, `@map("snake_case")` fields, timestamps.

#### PriceTier
```prisma
model PriceTier {
  id        String  @id @default(cuid())
  productId String  @map("product_id")
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  minQty    Int     @map("min_qty")
  maxQty    Int?    @map("max_qty")  // null = open-ended (11+)
  price     Int                       // VND integer
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@unique([productId, minQty])
  @@map("price_tiers")
}
```
- **Overlap validation**: Application-level check in PriceTierService (AC-US1-05). On create/update, query existing tiers for the product and reject if any range overlaps.

#### Cart / CartItem
```prisma
model Cart {
  id        String     @id @default(cuid())
  userId    String     @unique @map("user_id")
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  items     CartItem[]
  createdAt DateTime   @default(now()) @map("created_at")
  updatedAt DateTime   @updatedAt @map("updated_at")

  @@map("carts")
}

model CartItem {
  id        String  @id @default(cuid())
  cartId    String  @map("cart_id")
  cart      Cart    @relation(fields: [cartId], references: [id], onDelete: Cascade)
  productId String  @map("product_id")
  product   Product @relation(fields: [productId], references: [id])
  quantity  Int

  @@unique([cartId, productId])
  @@map("cart_items")
}
```

#### Coupon / CouponUsage
```prisma
model Coupon {
  id                String        @id @default(cuid())
  code              String        @unique
  type              CouponType
  value             Int?                                // discount amount or percentage (x100 for %)
  maxDiscount       Int?          @map("max_discount")  // cap for percentage coupons
  minPurchase       Int?          @map("min_purchase")  // minimum subtotal
  usageLimit        Int?          @map("usage_limit")   // global usage cap
  perUserLimit      Int?          @map("per_user_limit")
  validFrom         DateTime?     @map("valid_from")
  validUntil        DateTime?     @map("valid_until")
  applicableCategory String?      @map("applicable_category") // category slug restriction
  buyQty            Int?          @map("buy_qty")       // for BUY_X_GET_Y
  getQty            Int?          @map("get_qty")       // for BUY_X_GET_Y
  isActive          Boolean       @default(true) @map("is_active")
  // Reseller fields (schema-ready, NOT processed in this increment)
  isResellerCoupon  Boolean       @default(false) @map("is_reseller_coupon")
  resellerId        String?       @map("reseller_id")
  commissionType    String?       @map("commission_type")
  commissionValue   Int?          @map("commission_value")
  commissionBase    String?       @map("commission_base")
  usages            CouponUsage[]
  createdAt         DateTime      @default(now()) @map("created_at")
  updatedAt         DateTime      @updatedAt @map("updated_at")

  @@map("coupons")
}

enum CouponType {
  PERCENTAGE
  FIXED
  FREE_SHIPPING
  BUY_X_GET_Y
}

model CouponUsage {
  id        String   @id @default(cuid())
  couponId  String   @map("coupon_id")
  coupon    Coupon   @relation(fields: [couponId], references: [id])
  userId    String   @map("user_id")
  user      User     @relation(fields: [userId], references: [id])
  orderId   String?  @map("order_id")
  usedAt    DateTime @default(now()) @map("used_at")

  @@map("coupon_usages")
}
```

#### Address
```prisma
model Address {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  fullName  String   @map("full_name")
  phone     String
  street    String
  ward      String
  district  String
  province  String
  isDefault Boolean  @default(false) @map("is_default")
  orders    Order[]
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("addresses")
}
```

#### Order / OrderItem / OrderStatusHistory
```prisma
model Order {
  id              String             @id @default(cuid())
  orderNumber     String             @unique @map("order_number")
  userId          String             @map("user_id")
  user            User               @relation(fields: [userId], references: [id])
  addressId       String             @map("address_id")
  address         Address            @relation(fields: [addressId], references: [id])
  status          OrderStatus        @default(PENDING)
  paymentMethod   PaymentMethod      @map("payment_method")
  paymentStatus   PaymentStatus      @default(UNPAID) @map("payment_status")
  subtotal        Int
  discountAmount  Int                @default(0) @map("discount_amount")
  shippingFee     Int                @default(0) @map("shipping_fee")
  total           Int
  couponId        String?            @map("coupon_id")
  couponCode      String?            @map("coupon_code")
  channel         String             @default("website")
  paymentRef      String?            @map("payment_ref")
  items           OrderItem[]
  statusHistory   OrderStatusHistory[]
  createdAt       DateTime           @default(now()) @map("created_at")
  updatedAt       DateTime           @updatedAt @map("updated_at")

  @@map("orders")
}

enum OrderStatus {
  PENDING
  CONFIRMED
  SHIPPING
  DELIVERED
  CANCELLED
  RETURNED
}

enum PaymentMethod {
  VNPAY
  MOMO
  BANK_TRANSFER
  COD
}

enum PaymentStatus {
  UNPAID
  PAID
  REFUNDED
}

model OrderItem {
  id         String  @id @default(cuid())
  orderId    String  @map("order_id")
  order      Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId  String  @map("product_id")
  product    Product @relation(fields: [productId], references: [id])
  quantity   Int
  unitPrice  Int     @map("unit_price")
  subtotal   Int

  @@map("order_items")
}

model OrderStatusHistory {
  id        String      @id @default(cuid())
  orderId   String      @map("order_id")
  order     Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)
  status    OrderStatus
  note      String?
  createdAt DateTime    @default(now()) @map("created_at")

  @@map("order_status_history")
}
```

### 2.2 Relations Added to Existing Models

- **User**: add `cart Cart?`, `orders Order[]`, `addresses Address[]`, `couponUsages CouponUsage[]`
- **Product**: add `priceTiers PriceTier[]`, `cartItems CartItem[]`, `orderItems OrderItem[]`

### 2.3 Order Number Generation

Format: `SV-YYYYMMDD-XXXX` where XXXX is a zero-padded daily sequence. Implementation: Prisma `$transaction` with atomic counter query. Fallback: cuid-based suffix if counter unavailable.

## 3. API Module Design

### 3.1 Module Dependency Graph

```
AppModule
  |-- AuthModule (existing)
  |-- ProductsModule (existing, add PriceTier relation)
  |-- PriceTierModule (NEW)
  |-- CartModule (NEW) --> PriceEngineModule
  |-- CouponModule (NEW)
  |-- AddressModule (NEW)
  |-- CheckoutModule (NEW) --> CartModule, CouponModule, PriceEngineModule, PaymentModule
  |-- OrderModule (NEW)
  |-- PaymentModule (NEW) --> OrderModule
  |-- PriceEngineModule (NEW, shared service)
```

### 3.2 PriceEngineModule (Shared Service)

**Responsibility**: All price calculations are centralized here. No other module computes prices.

```typescript
@Injectable()
export class PriceEngineService {
  // Core pricing - looks up tier for given quantity
  getUnitPrice(productId: string, quantity: number): Promise<number>;

  // Cart-level calculation with tier application
  calculateCart(items: CartItemWithProduct[]): Promise<CartCalculation>;

  // Coupon application (delegates to CouponService for validation)
  applyCoupon(cartCalc: CartCalculation, couponCode: string, userId: string): Promise<CartCalculation>;

  // Final order total
  calculateOrderTotal(cartCalc: CartCalculation, shippingFee: number): OrderTotal;
}

interface CartCalculation {
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    tierApplied: string | null;
  }>;
  subtotal: number;
  couponDiscount: number;
  shippingFee: number;
  total: number;
}
```

**Decision**: Centralized engine prevents price calculation drift between cart preview and order placement. The engine reads PriceTier data directly via Prisma.

### 3.3 CartModule

**Endpoints** (all require AuthGuard except noted):

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/cart` | Required | Get current user's cart with calculated prices |
| POST | `/cart/items` | Required | Add item (productId, quantity) |
| PATCH | `/cart/items/:id` | Required | Update quantity |
| DELETE | `/cart/items/:id` | Required | Remove item |
| POST | `/cart/merge` | Required | Merge guest cart (body: localStorage items) |

**Guest cart strategy**: Frontend stores `{ productId, quantity }[]` in localStorage. On login, frontend calls `POST /cart/merge` with the localStorage payload. The merge endpoint sums quantities for duplicate products, then clears the response with a flag so frontend wipes localStorage.

### 3.4 CouponModule

**Endpoints**:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/coupons/validate` | Required | Validate coupon against current cart |
| POST | `/coupons` | Admin | Create coupon (API-only, no admin UI) |
| PATCH | `/coupons/:id` | Admin | Update coupon |
| DELETE | `/coupons/:id` | Admin | Deactivate coupon |

**Validation chain** (executed in order, fail-fast):
1. Coupon exists and `isActive === true`
2. `validFrom <= now <= validUntil`
3. `usageCount < usageLimit` (global)
4. `userUsageCount < perUserLimit` (per-user)
5. `cartSubtotal >= minPurchase`
6. Category restriction check (if `applicableCategory` set)
7. BUY_X_GET_Y quantity check

Each validator returns a specific error message per AC-US3-01 through AC-US3-05.

### 3.5 AddressModule

**Endpoints** (all require AuthGuard):

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/addresses` | Required | List user's addresses |
| POST | `/addresses` | Required | Create address |
| PATCH | `/addresses/:id` | Required | Update address |
| DELETE | `/addresses/:id` | Required | Delete address |
| PATCH | `/addresses/:id/default` | Required | Set as default |

**Default address logic**: When setting a new default, use a transaction to unset the previous default first. When deleting the default address, no automatic promotion (AC-US6-04).

### 3.6 CheckoutModule

**Endpoints**:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/checkout/preview` | Required | Calculate final totals with address + coupon |
| POST | `/checkout/place-order` | Required | Create order, initiate payment |

**`place-order` flow**:
1. Re-validate cart (prices, product availability)
2. Re-validate coupon (if provided)
3. Calculate final totals via PriceEngineService
4. Create Order + OrderItems + initial OrderStatusHistory in a Prisma transaction
5. Record CouponUsage (if coupon applied)
6. Clear user's cart
7. Route to payment:
   - **VNPay/Momo**: Generate payment URL, return redirect URL to frontend
   - **COD/Bank Transfer**: Order stays PENDING/UNPAID, return order confirmation

**Idempotency**: The `place-order` endpoint accepts an optional `idempotencyKey` header. Before creating, check if an order with that key exists. This prevents double-orders from network retries.

### 3.7 PaymentModule

**Endpoints**:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/payments/vnpay/ipn` | Signature | VNPay IPN webhook |
| POST | `/payments/momo/ipn` | Signature | Momo IPN webhook |
| GET | `/payments/vnpay/return` | None | VNPay redirect-back URL |
| GET | `/payments/momo/return` | None | Momo redirect-back URL |

**Webhook processing**:
1. Verify signature (HMAC-SHA256 for VNPay, RSA for Momo)
2. Look up order by `paymentRef`
3. If payment successful: update `paymentStatus = PAID`, `status = CONFIRMED`, add to OrderStatusHistory
4. If payment failed: update `paymentStatus = UNPAID`, leave status as PENDING
5. Return acknowledgment to payment gateway

**Security**: IPN endpoints have NO AuthGuard. They validate via cryptographic signatures only. Return URLs are informational (frontend redirect targets); they do NOT update order status.

### 3.8 OrderModule

**Endpoints** (all require AuthGuard):

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/orders` | Required | Paginated list of user's orders |
| GET | `/orders/:orderNumber` | Required | Order detail with items + status history |
| POST | `/orders/:orderNumber/cancel` | Required | Cancel order (only if PENDING) |

### 3.9 PriceTierModule

**Endpoints**:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/products/:productId/price-tiers` | Public | List tiers for a product |
| POST | `/products/:productId/price-tiers` | Admin | Create tier (with overlap validation) |
| PATCH | `/price-tiers/:id` | Admin | Update tier |
| DELETE | `/price-tiers/:id` | Admin | Delete tier |

## 4. Frontend Architecture (Next.js 15 App Router)

### 4.1 Route Structure

```
apps/web/src/app/
  products/[slug]/         (existing - add tier display + add-to-cart)
  cart/
    page.tsx               (cart page with quantity editing, coupon input)
  checkout/
    page.tsx               (address selection, payment method, order summary)
  orders/
    page.tsx               (order list)
    [orderNumber]/
      page.tsx             (order detail)
  account/
    addresses/
      page.tsx             (address management)
```

### 4.2 Cart State Management

**Approach**: React Context (`CartContext`) wrapping the app layout.

- **Guest**: Context reads/writes localStorage. Cart display uses client-side tier price lookup (fetched from API on product load, cached).
- **Authenticated**: Context syncs with API (`GET /cart`). All mutations go through API, which returns the updated cart with server-calculated prices.
- **Login transition**: `CartContext` detects auth state change, calls `POST /cart/merge` with localStorage items, then switches to API-backed mode and clears localStorage.

**Why Context over Zustand/Jotai**: The cart is a single global concern with simple shape. Context avoids adding a dependency. If performance becomes an issue (re-renders), extract to Zustand in a future increment.

### 4.3 Component Breakdown

| Component | Location | Type | Description |
|-----------|----------|------|-------------|
| `PriceTierTable` | `packages/ui` | Presentational | Displays tier breakpoints |
| `AddToCartButton` | `packages/ui` | Presentational | Quantity selector + add button |
| `CartItemRow` | `apps/web` | Client component | Single cart item with qty controls |
| `CartSummary` | `apps/web` | Client component | Subtotal, discounts, shipping, total |
| `CouponInput` | `apps/web` | Client component | Code input + validate button |
| `AddressSelector` | `apps/web` | Client component | Saved address list + new address form |
| `PaymentMethodSelector` | `apps/web` | Client component | Radio group for payment methods |
| `OrderCard` | `apps/web` | Server component | Order summary card in list |
| `OrderStatusBadge` | `packages/ui` | Presentational | Color-coded status pill |
| `AddressForm` | `apps/web` | Client component | CRUD form for addresses |

### 4.4 Shared Types (packages/shared)

New types to add in dedicated files:

```typescript
// cart.ts
export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  tierApplied: string | null;
}
export interface Cart {
  items: CartItem[];
  subtotal: number;
  couponDiscount: number;
  shippingFee: number;
  total: number;
  couponCode?: string;
}

// coupon.ts
export type CouponType = 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING' | 'BUY_X_GET_Y';
export interface CouponValidationResult {
  valid: boolean;
  discount: number;
  message: string;
}

// order.ts
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
export type PaymentMethod = 'VNPAY' | 'MOMO' | 'BANK_TRANSFER' | 'COD';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';
export interface OrderSummary {
  orderNumber: string;
  date: string;
  total: number;
  status: OrderStatus;
  itemCount: number;
}
export interface OrderDetail extends OrderSummary {
  items: OrderItemDetail[];
  address: Address;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  couponCode?: string;
  discountAmount: number;
  shippingFee: number;
  subtotal: number;
  statusHistory: StatusHistoryEntry[];
}

// address.ts
export interface Address {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  ward: string;
  district: string;
  province: string;
  isDefault: boolean;
}
```

## 5. Key Architectural Decisions

### ADR-001: Server-Authoritative Price Calculation
- **Decision**: All price calculations happen server-side in PriceEngineService. Frontend displays server-returned values.
- **Rationale**: Prevents client-side price manipulation. Single source of truth for tier lookups and coupon math. Integer-only VND arithmetic avoids floating-point issues.
- **Trade-off**: Cart interactions require API round-trips for authenticated users. Mitigated by optimistic UI updates on quantity change, reconciled with API response.

### ADR-002: Hybrid Cart Storage (DB + localStorage)
- **Decision**: Authenticated users get DB-backed carts; guests use localStorage with merge-on-login.
- **Rationale**: Guests can browse and add to cart without creating accounts. DB cart ensures persistence across devices for logged-in users.
- **Trade-off**: Merge logic adds complexity. The merge endpoint handles duplicate resolution (sum quantities). Edge case: if a product is deactivated between guest carting and login, it is silently dropped during merge with a warning in the response.

### ADR-003: Coupon Validation Chain (Fail-Fast)
- **Decision**: Validation rules execute in a defined order, returning the first failure.
- **Rationale**: Clear error messages per AC. Avoids confusing multi-error responses. Order is: existence -> expiry -> global limit -> per-user limit -> min purchase -> category -> type-specific.

### ADR-004: Payment Webhook Security
- **Decision**: IPN endpoints bypass AuthGuard, validate via cryptographic signatures only.
- **Rationale**: Payment gateways cannot carry JWT tokens. Signature verification is the standard approach for VNPay (HMAC-SHA256) and Momo (RSA). Return URLs are display-only and never mutate order state.

### ADR-005: Order Number Format
- **Decision**: `SV-YYYYMMDD-XXXX` format with daily sequential counter.
- **Rationale**: Human-readable for customer service. Date prefix aids debugging. Sequential within day prevents collisions. Implemented via Prisma `$transaction` with atomic increment.

## 6. Security Considerations

- **Price tampering**: Frontend never sends prices. Server computes all totals from DB data.
- **Coupon abuse**: Per-user limits enforced via CouponUsage records. Race conditions on global limits handled by `$transaction` with row-level locking.
- **Cart ownership**: CartModule verifies `cart.userId === request.user.id` on all mutations.
- **Order access**: OrderModule filters by `userId` -- users can only see their own orders.
- **Payment webhooks**: Signature verification before any state mutation. Replay protection via checking `paymentRef` uniqueness.
- **Address access**: AddressModule filters by `userId`.

## 7. Implementation Order

The recommended task execution order based on dependencies:

1. **Schema & migrations**: PriceTier, Cart/CartItem, Coupon/CouponUsage, Address, Order/OrderItem/OrderStatusHistory, enums
2. **Shared types**: Cart, Coupon, Order, Address types in packages/shared
3. **PriceEngineModule**: Core pricing service (no external deps)
4. **PriceTierModule**: CRUD + overlap validation
5. **CouponModule**: CRUD + validation chain
6. **AddressModule**: CRUD + default logic
7. **CartModule**: Depends on PriceEngine
8. **OrderModule**: CRUD + cancel + status history
9. **CheckoutModule**: Depends on Cart, Coupon, PriceEngine, Payment
10. **PaymentModule**: VNPay + Momo integration, webhook handlers
11. **Frontend - Product page updates**: Tier display, add-to-cart button
12. **Frontend - Cart page**: CartContext, cart UI, coupon input
13. **Frontend - Address management**: Account section
14. **Frontend - Checkout page**: Full checkout flow
15. **Frontend - Order pages**: List + detail + cancel

## 8. Technical Challenges

### Challenge 1: Cart Merge on Login
**Problem**: Guest localStorage cart must merge with potentially existing DB cart on login.
**Solution**: Dedicated `POST /cart/merge` endpoint that runs in a transaction: upsert each guest item (sum quantities for duplicates), skip deactivated products, return merged cart.
**Risk**: Race condition if user logs in on two tabs. Mitigated by `@@unique([cartId, productId])` constraint.

### Challenge 2: Payment Webhook Reliability
**Problem**: VNPay/Momo may retry IPNs if acknowledgment fails. Must be idempotent.
**Solution**: Check `paymentRef` + current `paymentStatus` before updating. If already PAID, return success without re-processing. Log all IPN attempts for debugging.

### Challenge 3: Order Placement Atomicity
**Problem**: Creating order, recording coupon usage, and clearing cart must all succeed or all fail.
**Solution**: Wrap entire place-order flow in a Prisma interactive transaction (`prisma.$transaction(async (tx) => { ... })`). If any step fails, the transaction rolls back.

### Challenge 4: Coupon Race Conditions
**Problem**: Two users applying the same coupon simultaneously when only 1 use remains.
**Solution**: Within the place-order transaction, re-count usages with a `SELECT ... FOR UPDATE` (via `$queryRaw`) before recording new usage.

## 9. Delegation Recommendations

- **Backend implementation**: `backend:nodejs` -- NestJS modules, Prisma schema, payment integration
- **Frontend implementation**: `frontend:architect` -- Next.js pages, CartContext, component design
- **Testing**: `testing:integration` -- Vitest for service-level tests, Playwright for checkout E2E flow
