---
increment: 0004-ecommerce-flow
title: "Full Customer E-Commerce Flow"
generated: 2026-03-11
tdd_mode: true
by_user_story:
  US-001: [T-001, T-002, T-003]
  US-002: [T-004, T-005, T-006, T-007, T-008]
  US-003: [T-009, T-010, T-011, T-012, T-013]
  US-004: [T-014, T-015, T-016, T-017, T-018, T-019]
  US-005: [T-020, T-021, T-022, T-023, T-024, T-025, T-026]
  US-006: [T-027, T-028, T-029, T-030]
  US-007: [T-031, T-032, T-033, T-034]
  INFRA:  [T-035, T-036, T-037, T-038, T-039, T-040, T-041, T-042, T-043, T-044]
total_tasks: 44
completed_tasks: 44
---

# Tasks: Full Customer E-Commerce Flow

## Implementation Order Note

Follow the dependency order from plan.md section 7: Schema → Shared Types → PriceEngine → PriceTier → Coupon → Address → Cart → Order → Checkout → Payment → Frontend.

---

## Phase 0: Schema and Infrastructure

### T-035: Prisma Schema - PriceTier, Cart, CartItem Models

**User Story**: INFRA
**Satisfies ACs**: AC-US1-04, AC-US4-01, AC-US4-03
**Status**: [x] completed

**Test Plan**:
- **Given** the Prisma schema file is updated with PriceTier, Cart, and CartItem models
- **When** `prisma migrate dev` runs
- **Then** tables `price_tiers`, `carts`, `cart_items` are created with correct columns, types, and constraints

**Test Cases**:
1. **Integration**: `apps/api/src/prisma/schema.test.ts`
   - testPriceTierTableExists(): Verify price_tiers columns: id, product_id, min_qty, max_qty (nullable), price (Int), timestamps
   - testCartUniqueUserConstraint(): Verify carts.user_id has UNIQUE constraint
   - testCartItemUniqueConstraint(): Verify @@unique([cartId, productId]) on cart_items
   - **Coverage Target**: Schema integrity - 100% of new model fields

**Implementation**:
1. Add `PriceTier` model to `apps/api/prisma/schema.prisma` (per plan.md section 2.1)
2. Add `Cart` and `CartItem` models
3. Add `priceTiers`, `cartItems` relations to existing `Product` model
4. Add `cart` relation to existing `User` model
5. Run `pnpm prisma migrate dev --name add-price-tier-cart`

---

### T-036: Prisma Schema - Coupon, CouponUsage Models

**User Story**: INFRA
**Satisfies ACs**: AC-US2-01, AC-US2-02, AC-US2-03, AC-US2-04, AC-US2-05, AC-US3-01, AC-US3-02, AC-US3-03, AC-US3-04, AC-US3-05
**Status**: [x] completed

**Test Plan**:
- **Given** the Prisma schema has Coupon and CouponUsage models with the CouponType enum
- **When** the migration runs
- **Then** tables `coupons` and `coupon_usages` exist with all fields including reseller schema-ready fields

**Test Cases**:
1. **Integration**: `apps/api/src/prisma/schema.test.ts`
   - testCouponTypeEnum(): Verify PERCENTAGE, FIXED, FREE_SHIPPING, BUY_X_GET_Y values
   - testCouponResellerFieldsNullable(): Verify reseller_id, commission_type, commission_value are nullable
   - testCouponUsageForeignKeys(): Verify coupon_id and user_id FK constraints
   - **Coverage Target**: 100% of coupon fields

**Implementation**:
1. Add `CouponType` enum to schema
2. Add `Coupon` model with all fields including reseller fields (schema-ready, NOT processed)
3. Add `CouponUsage` model
4. Add `couponUsages` relation to existing `User` model
5. Run `pnpm prisma migrate dev --name add-coupon`

---

### T-037: Prisma Schema - Address Model

**User Story**: INFRA
**Satisfies ACs**: AC-US6-01, AC-US6-02, AC-US6-03, AC-US6-04
**Status**: [x] completed

**Test Plan**:
- **Given** the Address model is added to the schema
- **When** migration runs
- **Then** table `addresses` exists with all address fields and `is_default` boolean

**Test Cases**:
1. **Integration**: `apps/api/src/prisma/schema.test.ts`
   - testAddressFields(): Verify full_name, phone, street, ward, district, province, is_default
   - testAddressUserFKCascade(): Verify onDelete: Cascade from Address to User
   - **Coverage Target**: 100%

**Implementation**:
1. Add `Address` model to schema
2. Add `orders` and `addresses` relations to `User` model
3. Run `pnpm prisma migrate dev --name add-address`

---

### T-038: Prisma Schema - Order, OrderItem, OrderStatusHistory Models + Enums

**User Story**: INFRA
**Satisfies ACs**: AC-US5-02, AC-US5-03, AC-US5-04, AC-US5-05, AC-US7-01, AC-US7-02, AC-US7-03, AC-US7-04
**Status**: [x] completed

**Test Plan**:
- **Given** Order, OrderItem, OrderStatusHistory models and OrderStatus, PaymentMethod, PaymentStatus enums are in schema
- **When** migration runs
- **Then** all order tables exist with correct column types; `order_number` has UNIQUE constraint; `channel` defaults to "website"

**Test Cases**:
1. **Integration**: `apps/api/src/prisma/schema.test.ts`
   - testOrderEnums(): Verify OrderStatus (PENDING/CONFIRMED/SHIPPING/DELIVERED/CANCELLED/RETURNED), PaymentMethod (VNPAY/MOMO/BANK_TRANSFER/COD), PaymentStatus (UNPAID/PAID/REFUNDED)
   - testOrderNumberUnique(): Verify unique constraint on order_number
   - testOrderChannelDefault(): Verify default "website" on channel field
   - testOrderStatusHistoryRelation(): Verify cascade delete on order_status_history
   - **Coverage Target**: 100%

**Implementation**:
1. Add `OrderStatus`, `PaymentMethod`, `PaymentStatus` enums
2. Add `Order`, `OrderItem`, `OrderStatusHistory` models
3. Add `orders` relation to `Address` model
4. Run `pnpm prisma migrate dev --name add-order`

---

### T-039: Shared Types Package - Cart, Coupon, Order, Address Types

**User Story**: INFRA
**Satisfies ACs**: AC-US1-04, AC-US4-01, AC-US5-01
**Status**: [x] completed

**Test Plan**:
- **Given** shared TypeScript types are defined in `packages/shared`
- **When** they are imported in both API and web packages
- **Then** TypeScript compilation succeeds with no type errors

**Test Cases**:
1. **Unit**: `packages/shared/src/types/cart.test.ts`, `order.test.ts`, `coupon.test.ts`, `address.test.ts`
   - testCartItemShape(): Verify CartItem interface has all required fields
   - testOrderStatusType(): Verify OrderStatus union includes all 6 statuses
   - testCouponValidationResultShape(): Verify CouponValidationResult has valid, discount, message
   - **Coverage Target**: Type correctness verified via tsc, 90%

**Implementation**:
1. Create `packages/shared/src/types/cart.ts` - CartItem, Cart interfaces (per plan.md section 4.4)
2. Create `packages/shared/src/types/coupon.ts` - CouponType, CouponValidationResult
3. Create `packages/shared/src/types/order.ts` - OrderStatus, PaymentMethod, PaymentStatus, OrderSummary, OrderDetail
4. Create `packages/shared/src/types/address.ts` - Address interface
5. Export all from `packages/shared/src/index.ts`
6. Run `pnpm tsc --noEmit` in packages/shared

---

## User Story: US-001 - Quantity-Based Pricing Tiers

**Linked ACs**: AC-US1-01, AC-US1-02, AC-US1-03, AC-US1-04, AC-US1-05
**Tasks**: 3 total, 0 completed

---

### T-001: PriceEngineService - Tier Lookup and Unit Price Calculation

**User Story**: US-001
**Satisfies ACs**: AC-US1-02, AC-US1-03, AC-US1-04
**Status**: [x] completed

**Test Plan**:
- **Given** a product has tiers (1-5: 1,500,000 / 6-10: 1,300,000 / 11+: 1,100,000)
- **When** `getUnitPrice(productId, 7)` is called
- **Then** it returns 1,300,000 (integer VND)

**Test Cases**:
1. **Unit**: `apps/api/src/price-engine/price-engine.service.spec.ts`
   - testGetUnitPriceWithinTier(): qty=7 returns 1,300,000
   - testGetUnitPriceOpenEndedTier(): qty=15 returns 1,100,000 (maxQty=null tier)
   - testGetUnitPriceNoTiers(): product with no tiers returns base price from Product
   - testGetUnitPriceBoundary(): qty=6 returns 1,300,000 (first value in second tier)
   - testCalculateCart(): 2 items each with different tiers returns correct subtotals and combined subtotal
   - **Coverage Target**: 95%

2. **Integration**: `apps/api/src/price-engine/price-engine.service.int.spec.ts`
   - testPriceEngineWithRealDB(): Seed DB with tiers, call service, verify correct price returned
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/api/src/price-engine/price-engine.module.ts`
2. Create `apps/api/src/price-engine/price-engine.service.ts`
   - `getUnitPrice(productId, quantity)`: Query PriceTier by productId, find matching range, return price or product base price
   - `calculateCart(items)`: Map each item through getUnitPrice, sum subtotals
3. Register module in AppModule
4. Run `pnpm vitest run apps/api/src/price-engine`

---

### T-002: PriceTierModule - CRUD API with Overlap Validation

**User Story**: US-001
**Satisfies ACs**: AC-US1-04, AC-US1-05
**Status**: [x] completed

**Test Plan**:
- **Given** an admin attempts to create a PriceTier with minQty=5, maxQty=10 for a product that already has a tier 1-8
- **When** `POST /products/:productId/price-tiers` is called
- **Then** a 400 error is returned with message indicating overlapping ranges

**Test Cases**:
1. **Unit**: `apps/api/src/price-tiers/price-tier.service.spec.ts`
   - testCreateTierSuccess(): Non-overlapping tier saved successfully
   - testCreateTierOverlapReject(): Overlapping range throws ConflictException
   - testCreateOpenEndedTierOverlap(): New tier overlaps existing open-ended (maxQty=null) tier
   - testListTiersForProduct(): Returns all tiers sorted by minQty
   - **Coverage Target**: 95%

2. **Integration**: `apps/api/src/price-tiers/price-tier.controller.int.spec.ts`
   - testPostPriceTierAdminOnly(): Non-admin returns 403
   - testPostPriceTierOverlap(): Returns 400 with error message
   - testGetPriceTiersPublic(): Returns tier list without auth
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/api/src/price-tiers/` module (controller, service, dto, module files)
2. `PriceTierService.create()`: Query existing tiers for product, check for range overlap, then create
3. Overlap check: for each existing tier, if `newMin <= existing.maxQty && newMax >= existing.minQty` then conflict (treat null maxQty as infinity)
4. Controller routes: GET `/products/:productId/price-tiers` (public), POST/PATCH/DELETE (AdminGuard)
5. Run `pnpm vitest run apps/api/src/price-tiers`

---

### T-003: Product Detail Page - Price Tier Display

**User Story**: US-001
**Satisfies ACs**: AC-US1-01, AC-US1-02, AC-US1-03
**Status**: [x] completed

**Test Plan**:
- **Given** a product with 3 price tiers (1-5, 6-10, 11+)
- **When** I navigate to the product detail page
- **Then** a pricing table shows all three breakpoints with their unit prices in VND format

**Test Cases**:
1. **Unit**: `packages/ui/src/components/PriceTierTable.test.tsx`
   - testRendersTierRows(): All 3 tiers displayed as rows
   - testRendersOpenEndedTier(): Tier with null maxQty shows "11+" format
   - testRendersNoTiers(): Component not rendered when tiers array is empty
   - testFormatsVNDPrice(): Price 1300000 displays as "1.300.000 ₫"
   - **Coverage Target**: 90%

2. **E2E**: `apps/web/e2e/product-detail.spec.ts`
   - testPriceTierTableVisible(): Navigate to product with tiers, assert tier table present
   - testPriceTierHighlightOnQtyChange(): Change quantity to 7, assert 6-10 tier row is highlighted
   - **Coverage Target**: 100% of AC-US1-01 scenario

**Implementation**:
1. Create `packages/ui/src/components/PriceTierTable.tsx` - presentational component (props: tiers array)
2. Update `apps/web/src/app/products/[slug]/page.tsx` to fetch price tiers via `GET /products/:productId/price-tiers`
3. Render `<PriceTierTable tiers={tiers} selectedQty={qty} />` below product price
4. Highlight active tier row based on selected quantity (client component for interactivity)
5. Run `pnpm vitest run packages/ui` and `pnpm playwright test product-detail`

---

## User Story: US-002 - Coupon Code System

**Linked ACs**: AC-US2-01, AC-US2-02, AC-US2-03, AC-US2-04, AC-US2-05
**Tasks**: 5 total, 0 completed

---

### T-004: CouponService - PERCENTAGE Coupon Calculation (with max_discount cap)

**User Story**: US-002
**Satisfies ACs**: AC-US2-01, AC-US2-02
**Status**: [x] completed

**Test Plan**:
- **Given** a PERCENTAGE coupon SAVE10 with value=10 and max_discount=500,000
- **When** applied to a subtotal of 3,000,000
- **Then** discount is min(300,000, 500,000) = 300,000 VND

**Test Cases**:
1. **Unit**: `apps/api/src/coupons/coupon.service.spec.ts`
   - testPercentageNoCapApplied(): 10% of 3,000,000 = 300,000 (under cap of 500,000)
   - testPercentageCappedAtMaxDiscount(): 50% of 3,000,000 = 1,500,000 capped at 500,000
   - testPercentageIntegerMath(): Verify no floating point - all values are integers
   - **Coverage Target**: 95%

**Implementation**:
1. Create `apps/api/src/coupons/coupon.service.ts`
2. Implement `calculateDiscount(coupon, cartCalc)` method
3. PERCENTAGE case: `Math.min(Math.floor(subtotal * value / 100), maxDiscount ?? Infinity)`
4. All arithmetic in integer VND

---

### T-005: CouponService - FIXED and FREE_SHIPPING Coupon Calculation

**User Story**: US-002
**Satisfies ACs**: AC-US2-03, AC-US2-04
**Status**: [x] completed

**Test Plan**:
- **Given** a FIXED coupon FLAT200K with value=200,000
- **When** applied to any subtotal
- **Then** exactly 200,000 VND is subtracted

**Test Cases**:
1. **Unit**: `apps/api/src/coupons/coupon.service.spec.ts`
   - testFixedAmountDiscount(): Returns exactly value (200,000)
   - testFixedDiscountNeverExceedsSubtotal(): Subtotal 100,000 with FIXED 200,000 capped at 100,000
   - testFreeShippingZeroFee(): FREE_SHIPPING coupon makes shippingFee = 0
   - testFreeShippingNoSubtotalChange(): Subtotal unchanged when FREE_SHIPPING applied
   - **Coverage Target**: 95%

**Implementation**:
1. Add FIXED case to `calculateDiscount()`: return `Math.min(coupon.value, subtotal)`
2. Add FREE_SHIPPING case: return `{ couponDiscount: 0, shippingFee: 0 }` (zeroes shipping in CartCalculation)

---

### T-006: CouponService - BUY_X_GET_Y Coupon Calculation

**User Story**: US-002
**Satisfies ACs**: AC-US2-05
**Status**: [x] completed

**Test Plan**:
- **Given** a BUY_X_GET_Y coupon (buy 2 get 1 free) and cart has 3 units of applicable product at 500,000 each
- **When** coupon is applied
- **Then** cheapest qualifying item is free, discount = 500,000 VND

**Test Cases**:
1. **Unit**: `apps/api/src/coupons/coupon.service.spec.ts`
   - testBuyXGetYExactQuantity(): 3 items, buy 2 get 1 returns 1 free item
   - testBuyXGetYMultipleGroups(): 6 items, buy 2 get 1 returns 2 free items (2 groups)
   - testBuyXGetYBelowThreshold(): 2 items, buy 2 get 1 returns 0 free items (not enough)
   - testBuyXGetYCheapestFree(): Mixed prices, cheapest qualifying item is free
   - **Coverage Target**: 95%

**Implementation**:
1. Add BUY_X_GET_Y case to `calculateDiscount()`
2. Filter cart items by applicable product/category
3. Sort by unitPrice ascending (cheapest first for free)
4. Calculate `Math.floor(totalQty / (buyQty + getQty)) * getQty` free items
5. Sum the cheapest unit prices as discount amount

---

### T-007: CouponModule - API Endpoints and Admin CRUD

**User Story**: US-002
**Satisfies ACs**: AC-US2-01, AC-US2-02, AC-US2-03, AC-US2-04, AC-US2-05
**Status**: [x] completed

**Test Plan**:
- **Given** an admin user
- **When** they POST to `/coupons` with valid coupon data
- **Then** coupon is created and returned with 201 status

**Test Cases**:
1. **Integration**: `apps/api/src/coupons/coupon.controller.int.spec.ts`
   - testCreateCouponAdmin(): Admin creates PERCENTAGE coupon returns 201
   - testCreateCouponNonAdmin(): Regular user returns 403
   - testValidateCouponEndpoint(): Authenticated user validates coupon against cart returns discount
   - testUpdateCoupon(): PATCH updates coupon fields
   - testDeactivateCoupon(): DELETE sets isActive=false (soft delete)
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/api/src/coupons/coupon.controller.ts`
2. Create `apps/api/src/coupons/coupon.module.ts`
3. Implement POST `/coupons/validate` (AuthGuard), POST/PATCH/DELETE `/coupons` (AdminGuard)
4. Create DTOs: `CreateCouponDto`, `ValidateCouponDto`
5. Register CouponModule in AppModule

---

### T-008: PriceEngineService - applyCoupon Integration

**User Story**: US-002
**Satisfies ACs**: AC-US2-01, AC-US2-02, AC-US2-03, AC-US2-04, AC-US2-05
**Status**: [x] completed

**Test Plan**:
- **Given** a CartCalculation with subtotal=3,000,000 and a valid SAVE10 coupon
- **When** `PriceEngineService.applyCoupon()` is called
- **Then** the returned CartCalculation has couponDiscount=300,000 and correct total

**Test Cases**:
1. **Unit**: `apps/api/src/price-engine/price-engine.service.spec.ts`
   - testApplyCouponUpdatesTotal(): total = subtotal - couponDiscount + shippingFee
   - testApplyCouponFreeShipping(): ShippingFee zeroed in result
   - testCalculateOrderTotal(): Final total includes all components
   - **Coverage Target**: 95%

**Implementation**:
1. Add `applyCoupon(cartCalc, couponCode, userId)` to `PriceEngineService`
2. Delegate to `CouponService.validateAndCalculate()` (validates rules + calculates discount)
3. Merge discount into CartCalculation, recompute total
4. Add `calculateOrderTotal(cartCalc, shippingFee)` for final order amount

---

## User Story: US-003 - Coupon Validation Rules

**Linked ACs**: AC-US3-01, AC-US3-02, AC-US3-03, AC-US3-04, AC-US3-05
**Tasks**: 5 total, 0 completed

---

### T-009: CouponValidator - Expiry and Active Status Check

**User Story**: US-003
**Satisfies ACs**: AC-US3-01
**Status**: [x] completed

**Test Plan**:
- **Given** a coupon with valid_until = yesterday
- **When** `validateCoupon()` is called
- **Then** it throws BadRequestException with message "Coupon has expired"

**Test Cases**:
1. **Unit**: `apps/api/src/coupons/coupon-validator.service.spec.ts`
   - testExpiredCouponRejected(): valid_until in past returns "Coupon has expired"
   - testInactiveCouponRejected(): isActive=false returns "Coupon is not active"
   - testValidFromInFuture(): validFrom in future returns "Coupon is not yet active"
   - testNullDatesAlwaysValid(): No validFrom/validUntil passes expiry check
   - **Coverage Target**: 95%

**Implementation**:
1. Create `apps/api/src/coupons/coupon-validator.service.ts`
2. Implement step 1-2 of validation chain: existence + active check, then date range check
3. Use `new Date()` comparison (no external date libraries needed)

---

### T-010: CouponValidator - Usage Limit Check (Global and Per-User)

**User Story**: US-003
**Satisfies ACs**: AC-US3-02, AC-US3-03
**Status**: [x] completed

**Test Plan**:
- **Given** a coupon with usage_limit=100 and 100 CouponUsage records
- **When** a new user attempts to apply it
- **Then** it is rejected with "Coupon usage limit reached"

**Test Cases**:
1. **Unit**: `apps/api/src/coupons/coupon-validator.service.spec.ts`
   - testGlobalUsageLimitReached(): 100 usages, limit=100 returns rejected
   - testGlobalUsageLimitNotReached(): 99 usages, limit=100 passes
   - testPerUserLimitReached(): User has 1 usage, perUserLimit=1 returns "You have already used this coupon"
   - testPerUserLimitNullUnlimited(): perUserLimit=null always passes per-user check
   - **Coverage Target**: 95%

**Implementation**:
1. Add global usage count check: `COUNT(CouponUsage WHERE couponId=X)`
2. Add per-user usage count check: `COUNT(CouponUsage WHERE couponId=X AND userId=Y)`
3. Return specific error messages per AC-US3-02 and AC-US3-03

---

### T-011: CouponValidator - Minimum Purchase and Category Restriction

**User Story**: US-003
**Satisfies ACs**: AC-US3-04, AC-US3-05
**Status**: [x] completed

**Test Plan**:
- **Given** a coupon with min_purchase=500,000 and cart subtotal is 400,000
- **When** validation runs
- **Then** it is rejected with "Minimum purchase of 500,000 VND required"

**Test Cases**:
1. **Unit**: `apps/api/src/coupons/coupon-validator.service.spec.ts`
   - testMinPurchaseRejected(): subtotal=400,000, min=500,000 returns rejected with exact message
   - testMinPurchasePassed(): subtotal=500,000, min=500,000 passes (equal is valid)
   - testCategoryRestrictionMismatch(): Cart has only "Clothing", coupon restricts to "Electronics" returns "Coupon not applicable to items in cart"
   - testCategoryRestrictionMatch(): At least one cart item matches category passes
   - testNoCategoryRestriction(): applicableCategory=null passes category check
   - **Coverage Target**: 95%

**Implementation**:
1. Add min_purchase check: compare `cartSubtotal >= coupon.minPurchase`
2. Add category check: if `applicableCategory` set, verify at least one cart item's product belongs to that category slug
3. Error messages must match spec exactly (case-sensitive)

---

### T-012: CouponValidator - Full Validation Chain Integration

**User Story**: US-003
**Satisfies ACs**: AC-US3-01, AC-US3-02, AC-US3-03, AC-US3-04, AC-US3-05
**Status**: [x] completed

**Test Plan**:
- **Given** a valid coupon and a cart meeting all requirements
- **When** the full validation chain runs
- **Then** it passes all steps and returns the coupon object ready for discount calculation

**Test Cases**:
1. **Integration**: `apps/api/src/coupons/coupon-validator.int.spec.ts`
   - testFullChainValidCoupon(): All checks pass returns coupon
   - testFailFastOnFirstError(): Expired coupon with usage limit also reached returns only "expired" error
   - testValidationChainOrder(): Verifies fail-fast order matches plan.md section 3.4
   - **Coverage Target**: 90%

**Implementation**:
1. Compose validators in order: active -> date -> global limit -> per-user limit -> min purchase -> category -> type-specific
2. Each validator throws immediately on failure (fail-fast)
3. Wrap in `validateCoupon(code, userId, cartCalc)` public method

---

### T-013: POST /coupons/validate Endpoint Test

**User Story**: US-003
**Satisfies ACs**: AC-US3-01, AC-US3-02, AC-US3-03, AC-US3-04, AC-US3-05
**Status**: [x] completed

**Test Plan**:
- **Given** an authenticated user with an expired coupon code
- **When** they POST to `/coupons/validate`
- **Then** they receive 400 with `{ valid: false, message: "Coupon has expired" }`

**Test Cases**:
1. **Integration**: `apps/api/src/coupons/coupon.controller.int.spec.ts`
   - testValidateExpiredCoupon(): 400 with "Coupon has expired"
   - testValidateValidCoupon(): 200 with discount amount
   - testValidateUnauthenticated(): 401
   - **Coverage Target**: 90%

2. **E2E**: `apps/web/e2e/cart.spec.ts`
   - testCouponInputShowsError(): Enter expired code returns error message displayed inline
   - testCouponInputShowsDiscount(): Enter valid code returns discount applied to summary
   - **Coverage Target**: 100% of AC-US3 scenarios

**Implementation**:
1. Controller calls `CouponValidatorService.validateCoupon()` wrapped in try/catch
2. Returns `{ valid: boolean, discount: number, message: string }` per `CouponValidationResult` type
3. HTTP 400 on validation failure, 200 on success

---

## User Story: US-004 - Shopping Cart

**Linked ACs**: AC-US4-01, AC-US4-02, AC-US4-03, AC-US4-04, AC-US4-05
**Tasks**: 6 total, 0 completed

---

### T-014: CartModule - Backend CRUD Endpoints

**User Story**: US-004
**Satisfies ACs**: AC-US4-01, AC-US4-02
**Status**: [x] completed

**Test Plan**:
- **Given** an authenticated user with no cart
- **When** they POST to `/cart/items` with `{ productId, quantity: 7 }`
- **Then** cart is created, item added, and response includes unit price from tier lookup (1,300,000) and subtotal (9,100,000)

**Test Cases**:
1. **Unit**: `apps/api/src/cart/cart.service.spec.ts`
   - testAddItemCreatesCartIfNone(): Creates Cart record when user has no cart
   - testAddItemAppliesTierPrice(): qty=7 for tiered product returns correct unitPrice
   - testUpdateQuantityRecalculatesPrice(): Change qty from 7 to 11 applies new tier price
   - testRemoveItemDeletesCartItem(): Item removed, cart updated
   - testOwnershipCheck(): cart.userId !== request.user.id throws ForbiddenException
   - **Coverage Target**: 95%

2. **Integration**: `apps/api/src/cart/cart.controller.int.spec.ts`
   - testGetCartReturnsCalculatedPrices(): GET /cart returns items with unitPrice, subtotal, cart total
   - testAddItemEndpoint(): POST /cart/items returns 201 with updated cart
   - testUpdateItemEndpoint(): PATCH /cart/items/:id returns 200 with recalculated cart
   - testDeleteItemEndpoint(): DELETE /cart/items/:id returns 200
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/api/src/cart/` module (controller, service, dto, module)
2. `CartService.getCart(userId)`: Find or create cart, enrich items via PriceEngineService
3. `CartService.addItem(userId, productId, quantity)`: Upsert CartItem, return enriched cart
4. `CartService.updateItem(userId, itemId, quantity)`: Update quantity, verify ownership, return enriched cart
5. `CartService.removeItem(userId, itemId)`: Delete CartItem, verify ownership
6. Register CartModule (import PriceEngineModule)

---

### T-015: Cart Merge Endpoint - Guest Cart Login Merge

**User Story**: US-004
**Satisfies ACs**: AC-US4-04
**Status**: [x] completed

**Test Plan**:
- **Given** a guest user has `[{ productId: "A", quantity: 2 }]` in localStorage and their DB cart has `[{ productId: "A", quantity: 3 }]`
- **When** they log in and POST to `/cart/merge` with the localStorage payload
- **Then** product A has quantity 5 in the DB cart (quantities summed)

**Test Cases**:
1. **Unit**: `apps/api/src/cart/cart.service.spec.ts`
   - testMergeNewItems(): Guest item not in DB cart is added
   - testMergeDuplicateSumsQuantities(): Same productId has quantities summed
   - testMergeSkipsInactiveProducts(): Deactivated product in guest cart silently skipped, warning returned
   - testMergeIsAtomic(): DB error mid-merge triggers full rollback via Prisma transaction
   - **Coverage Target**: 95%

2. **E2E**: `apps/web/e2e/cart.spec.ts`
   - testGuestCartMergeOnLogin(): Add to cart as guest, log in, cart has merged items and localStorage cleared
   - **Coverage Target**: 100% of AC-US4-04

**Implementation**:
1. Add `POST /cart/merge` to CartController
2. `CartService.mergeGuestCart(userId, guestItems[])`: Run in Prisma `$transaction`, upsert each item (sum quantities), skip inactive products
3. Return `{ merged: CartItem[], skipped: string[], cart: Cart }` - frontend uses `skipped` to show warnings

---

### T-016: CartContext - React Context for Cart State Management

**User Story**: US-004
**Satisfies ACs**: AC-US4-01, AC-US4-02, AC-US4-03, AC-US4-04
**Status**: [x] completed

**Test Plan**:
- **Given** the CartContext provider wraps the app layout
- **When** a guest user adds an item
- **Then** it is stored in localStorage and the cart icon count updates

**Test Cases**:
1. **Unit**: `apps/web/src/context/CartContext.test.tsx`
   - testGuestAddItemToLocalStorage(): addItem() updates localStorage
   - testGuestCartSurvivesRefresh(): Mock localStorage, re-mount, items restored
   - testAuthCartSyncsWithAPI(): Authenticated user, addItem() calls POST /cart/items
   - testLoginTransitionMerges(): Auth state change triggers POST /cart/merge, localStorage cleared
   - testCartCountUpdates(): itemCount reflects sum of all quantities
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/web/src/context/CartContext.tsx`
2. Guest mode: read/write `localStorage.getItem('shopvui_cart')`
3. Auth mode: fetch from `GET /cart`, mutations via API, optimistic updates
4. Auth state change detection: `useEffect` watching `session?.user`, trigger merge on login
5. Export `useCart()` hook
6. Wrap in `apps/web/src/app/layout.tsx`

---

### T-017: Cart Page - UI with Quantity Editing and Coupon Input

**User Story**: US-004
**Satisfies ACs**: AC-US4-02, AC-US4-05
**Status**: [x] completed

**Test Plan**:
- **Given** the cart page has items with a coupon input
- **When** I enter a valid coupon code and click Apply
- **Then** the order summary updates to show subtotal, coupon discount, shipping, and final total as separate line items

**Test Cases**:
1. **Unit**: `apps/web/src/app/cart/page.test.tsx`
   - testCartItemRowQuantityChange(): Increment quantity triggers price recalculation
   - testCouponInputApply(): Enter code triggers POST /coupons/validate, summary updates
   - testCouponInputError(): Invalid code shows error message inline
   - testOrderSummaryLines(): Summary shows subtotal, couponDiscount, shippingFee, total
   - **Coverage Target**: 90%

2. **E2E**: `apps/web/e2e/cart.spec.ts`
   - testCartPageFullFlow(): Add item, view cart, change quantity, apply coupon, see updated total
   - **Coverage Target**: 100% of AC-US4-05

**Implementation**:
1. Create `apps/web/src/app/cart/page.tsx` (client component)
2. Create `apps/web/src/components/CartItemRow.tsx` - quantity stepper, remove button
3. Create `apps/web/src/components/CartSummary.tsx` - line items display
4. Create `apps/web/src/components/CouponInput.tsx` - input + Apply button + error/success state
5. Wire `useCart()` for data and mutations

---

### T-018: AddToCartButton Component - Product Page Integration

**User Story**: US-004
**Satisfies ACs**: AC-US4-01
**Status**: [x] completed

**Test Plan**:
- **Given** I am on a product page with quantity selector showing 7
- **When** I click "Add to Cart"
- **Then** the item is added with the tier-based price and the cart icon in the header shows updated count

**Test Cases**:
1. **Unit**: `packages/ui/src/components/AddToCartButton.test.tsx`
   - testAddToCartCallsContext(): Click triggers useCart().addItem() with correct productId and qty
   - testQuantitySelectorBounds(): Min=1, no negative quantities
   - testButtonDisabledWhileLoading(): Loading state shown during API call
   - **Coverage Target**: 90%

2. **E2E**: `apps/web/e2e/product-detail.spec.ts`
   - testAddToCartUpdatesHeaderCount(): Add 3 items, cart icon shows 3
   - **Coverage Target**: 100% of AC-US4-01

**Implementation**:
1. Create `packages/ui/src/components/AddToCartButton.tsx`
2. Props: `productId`, `onAddToCart(qty: number)` callback
3. Internal state: quantity (default 1, min 1)
4. Update `apps/web/src/app/products/[slug]/page.tsx` to use component and wire to `useCart().addItem()`

---

### T-019: Guest Cart localStorage Persistence

**User Story**: US-004
**Satisfies ACs**: AC-US4-03
**Status**: [x] completed

**Test Plan**:
- **Given** I am a guest user and add items to my cart
- **When** I refresh the page
- **Then** cart items are still present (loaded from localStorage)

**Test Cases**:
1. **Unit**: `apps/web/src/context/CartContext.test.tsx`
   - testLocalStorageKeyFormat(): Stored under key 'shopvui_cart'
   - testLocalStorageParseOnMount(): Malformed JSON gracefully defaults to empty cart
   - testLocalStorageUpdatedOnMutation(): addItem/removeItem updates localStorage synchronously
   - **Coverage Target**: 90%

2. **E2E**: `apps/web/e2e/cart.spec.ts`
   - testGuestCartPersistsAcrossRefresh(): Add item as guest, reload, item still in cart
   - **Coverage Target**: 100% of AC-US4-03

**Implementation**:
1. Guest cart logic already in CartContext (T-016); this task focuses on testing and hardening
2. Add localStorage error boundary (try/catch for quota exceeded, parse errors)
3. Add `shopvui_cart` key as named constant in a shared constants file

---

## User Story: US-005 - Checkout and Payment

**Linked ACs**: AC-US5-01, AC-US5-02, AC-US5-03, AC-US5-04, AC-US5-05
**Tasks**: 7 total, 0 completed

---

### T-020: CheckoutModule - Preview and Place-Order Endpoints

**User Story**: US-005
**Satisfies ACs**: AC-US5-01, AC-US5-04, AC-US5-05
**Status**: [x] completed

**Test Plan**:
- **Given** an authenticated user with items in cart, a valid address, and COD payment method
- **When** they POST to `/checkout/place-order`
- **Then** an Order is created with status PENDING, paymentStatus UNPAID, and the response includes the order number

**Test Cases**:
1. **Unit**: `apps/api/src/checkout/checkout.service.spec.ts`
   - testPlaceOrderCOD(): Creates order with PENDING/UNPAID, returns orderNumber
   - testPlaceOrderBankTransfer(): Creates order with PENDING/UNPAID, includes bank details in response
   - testPlaceOrderClearsCart(): After order created, user's cart is empty
   - testPlaceOrderRecordsCouponUsage(): If coupon applied, CouponUsage record created
   - testPlaceOrderIdempotency(): Same idempotencyKey returns existing order, no duplicate created
   - testPlaceOrderRevalidatesCart(): Deactivated product during checkout throws error
   - **Coverage Target**: 95%

2. **Integration**: `apps/api/src/checkout/checkout.controller.int.spec.ts`
   - testPreviewEndpoint(): POST /checkout/preview returns final totals without creating order
   - testPlaceOrderEndpoint(): POST /checkout/place-order returns 201 with orderNumber
   - testPlaceOrderUnauthenticated(): 401
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/api/src/checkout/` module
2. `CheckoutService.preview(userId, addressId, couponCode)`: Re-validate cart + coupon, return CartCalculation
3. `CheckoutService.placeOrder(userId, dto)`: Full transactional flow (plan.md section 3.6, steps 1-7)
4. Idempotency: check `Order.paymentRef` or a separate idempotency key field
5. Order number generation: `SV-YYYYMMDD-XXXX` via `$queryRaw` atomic counter

---

### T-021: CheckoutModule - VNPay Payment Initiation

**User Story**: US-005
**Satisfies ACs**: AC-US5-02
**Status**: [x] completed

**Test Plan**:
- **Given** an authenticated user places an order with VNPay
- **When** the order is created
- **Then** a VNPay payment URL is generated and returned in the response as `{ paymentUrl: "https://..." }`

**Test Cases**:
1. **Unit**: `apps/api/src/payments/vnpay.service.spec.ts`
   - testGenerateVNPayUrl(): Returns valid URL with required query params (vnp_Amount, vnp_OrderInfo, vnp_TxnRef, vnp_SecureHash)
   - testVNPaySecureHashHMACSHA256(): Hash computed correctly using configured secret key
   - testVNPayAmountConversion(): VND amount multiplied by 100 for VNPay API format
   - **Coverage Target**: 95%

**Implementation**:
1. Create `apps/api/src/payments/vnpay.service.ts`
2. `generatePaymentUrl(order)`: Build VNPay params, compute HMAC-SHA256, return URL
3. Store `paymentRef` (vnp_TxnRef) on Order record
4. Use env vars: `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_URL`

---

### T-022: CheckoutModule - Momo Payment Initiation

**User Story**: US-005
**Satisfies ACs**: AC-US5-03
**Status**: [x] completed

**Test Plan**:
- **Given** an authenticated user places an order with Momo
- **When** the order is created
- **Then** a Momo payment URL is returned and the order has paymentRef set to Momo's orderId

**Test Cases**:
1. **Unit**: `apps/api/src/payments/momo.service.spec.ts`
   - testGenerateMomoPaymentUrl(): Returns Momo payment URL
   - testMomoRequestSignature(): HMAC-SHA256 signature on request body
   - testMomoOrderIdStored(): paymentRef set to Momo's returned orderId
   - **Coverage Target**: 95%

**Implementation**:
1. Create `apps/api/src/payments/momo.service.ts`
2. `createPaymentRequest(order)`: POST to Momo API (sandbox), return payUrl
3. Use env vars: `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY`, `MOMO_API_URL`

---

### T-023: PaymentModule - VNPay IPN Webhook Handler

**User Story**: US-005
**Satisfies ACs**: AC-US5-02
**Status**: [x] completed

**Test Plan**:
- **Given** VNPay sends an IPN callback with valid signature and ResponseCode "00" (success)
- **When** `POST /payments/vnpay/ipn` is called
- **Then** the order status changes to CONFIRMED, paymentStatus to PAID, and a StatusHistory entry is added

**Test Cases**:
1. **Unit**: `apps/api/src/payments/payment.service.spec.ts`
   - testVNPayIPNSuccess(): ResponseCode "00", valid sig triggers order CONFIRMED + PAID
   - testVNPayIPNInvalidSignature(): Tampered sig returns 400, order unchanged
   - testVNPayIPNAlreadyPaid(): Order already PAID returns idempotent success, no re-processing
   - testVNPayIPNFailure(): ResponseCode != "00" keeps order PENDING/UNPAID
   - **Coverage Target**: 95%

2. **Integration**: `apps/api/src/payments/payment.controller.int.spec.ts`
   - testIPNEndpointNoAuthGuard(): No JWT required, signature-only validation
   - testIPNUpdatesOrderInDB(): Full flow with real DB updates order status
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/api/src/payments/payment.controller.ts` and `payment.service.ts`
2. `POST /payments/vnpay/ipn`: No AuthGuard, validate HMAC-SHA256 sig, process result
3. Use Prisma transaction: update Order status + paymentStatus + add OrderStatusHistory
4. Idempotency: `if (order.paymentStatus === 'PAID') return success immediately`

---

### T-024: PaymentModule - Momo IPN Webhook Handler

**User Story**: US-005
**Satisfies ACs**: AC-US5-03
**Status**: [x] completed

**Test Plan**:
- **Given** Momo sends an IPN callback with resultCode=0 (success) and valid signature
- **When** `POST /payments/momo/ipn` is called
- **Then** order status is CONFIRMED and paymentStatus is PAID

**Test Cases**:
1. **Unit**: `apps/api/src/payments/payment.service.spec.ts`
   - testMomoIPNSuccess(): resultCode=0, valid sig triggers CONFIRMED + PAID
   - testMomoIPNInvalidSignature(): Returns 400
   - testMomoIPNFailure(): resultCode!=0 keeps PENDING/UNPAID
   - **Coverage Target**: 95%

**Implementation**:
1. Add `POST /payments/momo/ipn` to PaymentController
2. Momo signature verification: HMAC-SHA256 on specified fields
3. Shared `processPaymentResult(orderId, success)` method used by both VNPay and Momo handlers

---

### T-025: Checkout Page - Frontend Full Checkout Flow

**User Story**: US-005
**Satisfies ACs**: AC-US5-01, AC-US5-02, AC-US5-03, AC-US5-04, AC-US5-05
**Status**: [x] completed

**Test Plan**:
- **Given** I am on the checkout page with items in cart
- **When** I select an address, choose COD, and click Confirm Order
- **Then** I am taken to a confirmation page showing my order number

**Test Cases**:
1. **Unit**: `apps/web/src/app/checkout/page.test.tsx`
   - testCheckoutPageRendersSummary(): Shows line items, discounts, shipping, total
   - testAddressSelectorShown(): Saved addresses listed, select triggers update
   - testPaymentMethodRadioGroup(): All 4 methods shown, selection state tracked
   - testConfirmButtonSubmitsOrder(): Click triggers POST /checkout/place-order
   - testVNPayRedirect(): VNPay response triggers window.location redirect to paymentUrl
   - **Coverage Target**: 90%

2. **E2E**: `apps/web/e2e/checkout.spec.ts`
   - testFullCheckoutCOD(): End-to-end: product, cart, checkout, COD confirm, order confirmation page
   - testCheckoutRequiresAuth(): Unauthenticated user redirected to login
   - **Coverage Target**: 100% of AC-US5-01 and AC-US5-04

**Implementation**:
1. Create `apps/web/src/app/checkout/page.tsx` (requires auth)
2. Create `apps/web/src/components/AddressSelector.tsx`
3. Create `apps/web/src/components/PaymentMethodSelector.tsx`
4. On VNPay/Momo: `window.location.href = data.paymentUrl`
5. On COD/Bank Transfer: redirect to `/orders/[orderNumber]`

---

### T-026: Order Confirmation and Bank Transfer Details Page

**User Story**: US-005
**Satisfies ACs**: AC-US5-05
**Status**: [x] completed

**Test Plan**:
- **Given** I completed a bank transfer order
- **When** I am redirected to the order confirmation page
- **Then** I see bank account details (account number, bank name, branch) and the order reference code

**Test Cases**:
1. **Unit**: `apps/web/src/app/orders/[orderNumber]/page.test.tsx`
   - testBankTransferDetailsShown(): Order with BANK_TRANSFER method renders bank details section
   - testOrderNumberDisplayed(): Order reference code visible prominently
   - **Coverage Target**: 90%

2. **E2E**: `apps/web/e2e/checkout.spec.ts`
   - testBankTransferConfirmationPage(): Full flow results in bank details visible on confirmation
   - **Coverage Target**: 100% of AC-US5-05

**Implementation**:
1. Bank account details stored as env vars: `BANK_ACCOUNT_NUMBER`, `BANK_NAME`, `BANK_BRANCH`
2. Checkout service returns bank details in response for BANK_TRANSFER orders
3. Order detail page renders bank section conditionally based on paymentMethod

---

## User Story: US-006 - Customer Saved Addresses

**Linked ACs**: AC-US6-01, AC-US6-02, AC-US6-03, AC-US6-04
**Tasks**: 4 total, 0 completed

---

### T-027: AddressModule - Backend CRUD and Default Logic

**User Story**: US-006
**Satisfies ACs**: AC-US6-01, AC-US6-03, AC-US6-04
**Status**: [x] completed

**Test Plan**:
- **Given** a user deletes their default address
- **When** DELETE `/addresses/:id` is called
- **Then** the address is deleted and no other address is auto-promoted to default

**Test Cases**:
1. **Unit**: `apps/api/src/addresses/address.service.spec.ts`
   - testCreateAddress(): Creates address with all 7 required fields
   - testSetDefault(): Uses transaction to unset previous default, then set new one
   - testDeleteDefaultAddress(): Deletes address; no auto-promotion of default
   - testDeleteNonOwnedAddress(): ForbiddenException if address belongs to other user
   - testListAddresses(): Returns only addresses for requesting user
   - **Coverage Target**: 95%

2. **Integration**: `apps/api/src/addresses/address.controller.int.spec.ts`
   - testAddressOwnershipEnforced(): User A cannot edit User B's address returns 403
   - testSetDefaultTransactional(): Previous default cleared in same transaction
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/api/src/addresses/` module
2. `AddressService.setDefault(userId, addressId)`: `$transaction([unsetPrevious, setNew])`
3. `AddressService.delete(userId, addressId)`: Verify ownership, delete - no auto-promotion
4. All methods filter by `userId` for ownership enforcement

---

### T-028: Address Management Page - Frontend

**User Story**: US-006
**Satisfies ACs**: AC-US6-01, AC-US6-02, AC-US6-03, AC-US6-04
**Status**: [x] completed

**Test Plan**:
- **Given** I am on the address management page
- **When** I add a new address with all required fields and click Save
- **Then** the new address appears in my list and can be set as default

**Test Cases**:
1. **Unit**: `apps/web/src/app/account/addresses/page.test.tsx`
   - testAddressFormRendersAllFields(): full_name, phone, street, ward, district, province fields present
   - testSetDefaultButton(): Click triggers PATCH /addresses/:id/default
   - testDeleteAddressButton(): Click triggers DELETE /addresses/:id, removed from list
   - testAddressListEmpty(): Empty state shown when no addresses
   - **Coverage Target**: 90%

2. **E2E**: `apps/web/e2e/addresses.spec.ts`
   - testAddAndSetDefaultAddress(): Add address, set default, verify default badge shown
   - testDeleteDefaultAddress(): Delete default, no address shows default badge
   - **Coverage Target**: 100% of AC-US6-01, AC-US6-03, AC-US6-04

**Implementation**:
1. Create `apps/web/src/app/account/addresses/page.tsx` (auth-required)
2. Create `apps/web/src/components/AddressForm.tsx` - controlled form
3. Create `apps/web/src/components/AddressCard.tsx` - displays address with Edit/Delete/Set Default buttons
4. Require auth via middleware or `getServerSession()` check

---

### T-029: AddressSelector in Checkout

**User Story**: US-006
**Satisfies ACs**: AC-US6-02
**Status**: [x] completed

**Test Plan**:
- **Given** I have 2 saved addresses and proceed to checkout
- **When** the checkout page loads
- **Then** both addresses are listed and I can select one or enter a new address inline

**Test Cases**:
1. **Unit**: `apps/web/src/components/AddressSelector.test.tsx`
   - testListsSavedAddresses(): Renders a radio option per saved address
   - testSelectAddress(): Select passes addressId to checkout form state
   - testNewAddressOption(): "Add new address" option expands inline form
   - testDefaultAddressPreselected(): Default address is pre-selected on load
   - **Coverage Target**: 90%

**Implementation**:
1. `AddressSelector` component fetches `GET /addresses` on mount
2. Radio group per address + "Add new address" option
3. New address inline form uses same `AddressForm` component from T-028
4. Pre-select the address where `isDefault === true`

---

### T-030: Address API - PATCH /addresses/:id/default Endpoint

**User Story**: US-006
**Satisfies ACs**: AC-US6-01, AC-US6-04
**Status**: [x] completed

**Test Plan**:
- **Given** user has 3 addresses and address B is current default
- **When** PATCH `/addresses/A/default` is called
- **Then** address A becomes default and address B's isDefault is false

**Test Cases**:
1. **Integration**: `apps/api/src/addresses/address.controller.int.spec.ts`
   - testSetDefaultSwitchesDefault(): Previous default cleared, new one set
   - testSetDefaultOwnAddressOnly(): 403 if other user's address
   - testSetDefaultNonExistent(): 404 if address not found
   - **Coverage Target**: 90%

**Implementation**:
1. Already scaffolded in T-027; this task verifies the dedicated PATCH `/addresses/:id/default` route
2. Confirm route is separate from PATCH `/addresses/:id` (general update)
3. Add integration tests per above test cases

---

## User Story: US-007 - Order History and Tracking

**Linked ACs**: AC-US7-01, AC-US7-02, AC-US7-03, AC-US7-04
**Tasks**: 4 total, 0 completed

---

### T-031: OrderModule - Backend Endpoints (List, Detail, Cancel)

**User Story**: US-007
**Satisfies ACs**: AC-US7-01, AC-US7-02, AC-US7-03, AC-US7-04
**Status**: [x] completed

**Test Plan**:
- **Given** a user has 15 orders
- **When** they GET `/orders?page=1&limit=10`
- **Then** they receive 10 orders sorted by createdAt descending with orderNumber, date, total, and status

**Test Cases**:
1. **Unit**: `apps/api/src/orders/order.service.spec.ts`
   - testListOrdersPaginated(): 15 orders, page 1 returns 10, sorted desc
   - testListOrdersUserFiltered(): Only returns orders for requesting user
   - testGetOrderDetail(): Returns all items, coupon, address, statusHistory
   - testCancelOrderPending(): PENDING order changes status to CANCELLED, history entry added
   - testCancelOrderConfirmed(): CONFIRMED order throws ForbiddenException (cannot cancel)
   - **Coverage Target**: 95%

2. **Integration**: `apps/api/src/orders/order.controller.int.spec.ts`
   - testGetOrdersListEndpoint(): GET /orders returns paginated response
   - testGetOrderDetailEndpoint(): GET /orders/:orderNumber returns full detail
   - testCancelOrderEndpoint(): POST /orders/:orderNumber/cancel returns 200, status = CANCELLED
   - testCancelNonPendingOrder(): Returns 400 or 403 with appropriate message
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/api/src/orders/` module
2. `OrderService.list(userId, page, limit)`: Paginated query, filter by userId, sort by createdAt desc
3. `OrderService.getDetail(userId, orderNumber)`: Include items, address, statusHistory; enforce userId filter
4. `OrderService.cancel(userId, orderNumber)`: Check status === PENDING, then update to CANCELLED in transaction, add history entry

---

### T-032: Order Status History Recording

**User Story**: US-007
**Satisfies ACs**: AC-US7-03
**Status**: [x] completed

**Test Plan**:
- **Given** an order transitions from CONFIRMED to SHIPPING
- **When** the status is updated
- **Then** a new OrderStatusHistory row is inserted with the new status and current timestamp

**Test Cases**:
1. **Unit**: `apps/api/src/orders/order.service.spec.ts`
   - testStatusHistoryEntryCreated(): Transition creates history record
   - testStatusHistoryTimestamp(): createdAt is set to current time
   - testStatusHistoryMultipleEntries(): Multiple transitions produce multiple history rows
   - **Coverage Target**: 95%

**Implementation**:
1. `OrderService.updateStatus(orderId, newStatus, note?)`: Wraps update + history insert in `$transaction`
2. Called internally by: cancel endpoint, payment webhook handler (T-023/T-024)
3. History visible in `OrderService.getDetail()` response

---

### T-033: Order List Page - Frontend

**User Story**: US-007
**Satisfies ACs**: AC-US7-01
**Status**: [x] completed

**Test Plan**:
- **Given** I navigate to "My Orders"
- **When** the page loads
- **Then** I see a paginated list of my orders sorted by most recent, showing order number, date, total, and status badge

**Test Cases**:
1. **Unit**: `apps/web/src/app/orders/page.test.tsx`
   - testRendersOrderCards(): Each order shows orderNumber, date, total, status
   - testPaginationControls(): Next/previous page buttons update displayed orders
   - testEmptyState(): No orders shows "No orders yet" message
   - testStatusBadgeColors(): PENDING = yellow, CONFIRMED = blue, CANCELLED = red, etc.
   - **Coverage Target**: 90%

2. **E2E**: `apps/web/e2e/orders.spec.ts`
   - testOrderListAfterCheckout(): Complete checkout, order appears in list
   - **Coverage Target**: 100% of AC-US7-01

**Implementation**:
1. Create `apps/web/src/app/orders/page.tsx` (server component, requires auth)
2. Fetch `GET /orders` with pagination params
3. Create `apps/web/src/components/OrderCard.tsx` (server component)
4. Create `packages/ui/src/components/OrderStatusBadge.tsx` - color-coded status pill
5. Implement pagination with `?page=` query param and prev/next links

---

### T-034: Order Detail Page - Frontend with Status History

**User Story**: US-007
**Satisfies ACs**: AC-US7-02, AC-US7-03, AC-US7-04
**Status**: [x] completed

**Test Plan**:
- **Given** I click on an order in my order list
- **When** the order detail page loads
- **Then** I see all line items, coupon info, shipping fee, payment method, delivery address, and a timeline of status changes

**Test Cases**:
1. **Unit**: `apps/web/src/app/orders/[orderNumber]/page.test.tsx`
   - testRendersAllLineItems(): Each OrderItem shows name, quantity, unitPrice, subtotal
   - testRendersStatusTimeline(): statusHistory entries rendered as timeline
   - testCancelButtonForPending(): PENDING order shows cancel button
   - testCancelButtonHiddenForNonPending(): CONFIRMED/SHIPPING hides cancel button
   - testCancelOrderAction(): Click cancel triggers POST /orders/:orderNumber/cancel, status updates
   - **Coverage Target**: 90%

2. **E2E**: `apps/web/e2e/orders.spec.ts`
   - testOrderDetailFullContent(): Navigate to detail, all sections visible
   - testCancelPendingOrder(): Cancel button click, order shows CANCELLED status
   - **Coverage Target**: 100% of AC-US7-02, AC-US7-04

**Implementation**:
1. Create `apps/web/src/app/orders/[orderNumber]/page.tsx` (server component with client cancel button)
2. Fetch `GET /orders/:orderNumber` for full detail
3. Status timeline as ordered list of history entries
4. Cancel button: client component, calls `POST /orders/:orderNumber/cancel`, refreshes page on success

---

## Phase 5: Remaining Infrastructure Tasks

### T-040: NestJS AppModule - Register All New Modules

**User Story**: INFRA
**Satisfies ACs**: AC-US1-04, AC-US4-01, AC-US5-01, AC-US6-01, AC-US7-01
**Status**: [x] completed

**Test Plan**:
- **Given** all new NestJS modules are created
- **When** the API server starts
- **Then** all module endpoints are available and the app starts without errors

**Test Cases**:
1. **Integration**: `apps/api/src/app.module.spec.ts`
   - testAllModulesRegistered(): Verify PriceTierModule, CouponModule, CartModule, AddressModule, CheckoutModule, OrderModule, PaymentModule all bootstrapped
   - **Coverage Target**: 90%

**Implementation**:
1. Update `apps/api/src/app.module.ts` to import all new modules
2. Verify module dependency graph matches plan.md section 3.1
3. Run `pnpm build` in apps/api to verify no import errors

---

### T-041: Environment Variables and Configuration

**User Story**: INFRA
**Satisfies ACs**: AC-US5-02, AC-US5-03
**Status**: [x] completed

**Test Plan**:
- **Given** the required env vars are defined
- **When** the API starts
- **Then** ConfigService successfully loads all payment gateway configuration

**Test Cases**:
1. **Unit**: `apps/api/src/config/config.spec.ts`
   - testVNPayConfigLoaded(): VNPAY_TMN_CODE, VNPAY_HASH_SECRET, VNPAY_URL present
   - testMomoConfigLoaded(): MOMO_PARTNER_CODE, MOMO_ACCESS_KEY, MOMO_SECRET_KEY, MOMO_API_URL present
   - testBankConfigLoaded(): BANK_ACCOUNT_NUMBER, BANK_NAME, BANK_BRANCH present
   - **Coverage Target**: 90%

**Implementation**:
1. Add all new env vars to `.env.example`
2. Add validation schema in `apps/api/src/config/` using `@nestjs/config` with `Joi` validation
3. Document sandbox/test values in `.env.example` comments

---

### T-042: Vitest Configuration and Test Infrastructure

**User Story**: INFRA
**Satisfies ACs**: all
**Status**: [x] completed

**Test Plan**:
- **Given** the Vitest config is set up for both unit and integration tests
- **When** `pnpm vitest run` is executed in apps/api
- **Then** all tests run with correct module resolution and Prisma mocking

**Test Cases**:
1. **Meta**: Verify vitest configuration is functional
   - Unit tests use `vi.mock('@prisma/client')` with `vi.hoisted()`
   - Integration tests connect to test DB (separate from dev DB)
   - **Coverage Target**: Infrastructure correctness

**Implementation**:
1. Verify `apps/api/vitest.config.ts` has separate configs for unit and integration
2. Set up `apps/api/src/test/prisma-mock.ts` for Prisma mock helper
3. Ensure `DATABASE_URL` for tests points to test DB (e.g., `shopvui_test`)

---

### T-043: Playwright E2E Test Setup for New Routes

**User Story**: INFRA
**Satisfies ACs**: AC-US4-01, AC-US5-01, AC-US7-01
**Status**: [x] completed

**Test Plan**:
- **Given** Playwright is configured for the web app
- **When** E2E tests run against the full stack (Next.js + NestJS + PostgreSQL)
- **Then** tests for cart, checkout, and orders execute successfully

**Test Cases**:
1. **E2E Infrastructure**:
   - testPlaywrightConfigRoutes(): cart, checkout, orders, account/addresses routes reachable
   - testAuthHelper(): Helper to log in as test user available for E2E tests
   - **Coverage Target**: Infrastructure correctness

**Implementation**:
1. Update `apps/web/playwright.config.ts` if needed to include new routes
2. Create `apps/web/e2e/helpers/auth.ts` - `loginAs(page, email, password)` helper
3. Create `apps/web/e2e/helpers/seed.ts` - seed test products, tiers, coupons for E2E

---

### T-044: Final Integration Test - Full E2E Purchase Flow

**User Story**: INFRA
**Satisfies ACs**: AC-US1-01, AC-US1-02, AC-US2-01, AC-US4-01, AC-US4-05, AC-US5-01, AC-US5-04, AC-US6-02, AC-US7-01
**Status**: [x] completed

**Test Plan**:
- **Given** a test user, seeded product with tiers, and seeded coupon
- **When** the full purchase flow runs end-to-end
- **Then** user can browse, add to cart with tier price, apply coupon, checkout COD, and see order in history

**Test Cases**:
1. **E2E**: `apps/web/e2e/full-purchase-flow.spec.ts`
   - testFullPurchaseFlow():
     - Navigate to product with tiers
     - Select quantity 7, verify tier price shown
     - Add to cart, cart icon shows 1
     - Go to cart, apply coupon, discount shown
     - Proceed to checkout, select saved address, choose COD
     - Confirm order, see order number on confirmation page
     - Navigate to My Orders, order appears in list
     - Click order, detail page shows all items
   - **Coverage Target**: 100% of happy path AC coverage

**Implementation**:
1. Create `apps/web/e2e/full-purchase-flow.spec.ts`
2. Uses helpers from T-043 (`loginAs`, `seed`)
3. This test runs LAST in CI - all unit/integration tests must pass first
