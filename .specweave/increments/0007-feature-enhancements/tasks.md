---
increment: 0007-feature-enhancements
title: "Feature Enhancements: Closing Remaining Gaps"
total_tasks: 20
completed_tasks: 20
---

# Tasks: Feature Enhancements

## Task Notation

- `[ ]` not started | `[x]` completed
- `[P]` parallelizable with other tasks in same phase

---

## User Story: US-001 - Customer Wishlist

**Linked ACs**: AC-US1-01, AC-US1-02, AC-US1-03, AC-US1-04, AC-US1-05
**Tasks**: 4 total, 4 completed

---

### T-001: Add Wishlist Prisma model and run migration

**User Story**: US-001
**Satisfies ACs**: AC-US1-04
**Status**: [x] completed

**Test Plan**:
- **Given** the Prisma schema has User and Product models
- **When** the Wishlist model with `@@unique([userId, productId])` is added and migrated
- **Then** the `wishlists` table exists with correct columns, FK constraints, and cascade deletes

**Test Cases**:
1. **Integration**: `apps/api/src/wishlist/wishlist.service.spec.ts`
   - `shouldPreventDuplicateWishlistEntry()`: Adding the same productId twice does not create a second row
   - `shouldCascadeDeleteOnUserDeletion()`: Deleting a User removes all their Wishlist rows
   - **Coverage Target**: 90%

**Implementation**:
1. Add `Wishlist` model to `packages/db/prisma/schema.prisma` (see AD-1 in plan.md for full schema)
2. Add `wishlists Wishlist[]` relation to `User` and `Product` models in schema
3. Run `pnpm --filter @shopvui/db prisma migrate dev --name add_wishlist_model`
4. Regenerate Prisma client: `pnpm --filter @shopvui/db prisma generate`

---

### T-002: Implement WishlistModule backend (NestJS)

**User Story**: US-001
**Satisfies ACs**: AC-US1-01, AC-US1-03, AC-US1-04, AC-US1-05
**Status**: [x] completed

**Test Plan**:
- **Given** an authenticated customer
- **When** they POST `/wishlist/:productId`
- **Then** the product is upserted into their wishlist and a 200/201 response is returned; a second POST returns 200 without a duplicate row
- **Given** an unauthenticated request to any `/wishlist` endpoint
- **When** the request reaches the CustomerAuthGuard
- **Then** a 401 is returned

**Test Cases**:
1. **Unit**: `apps/api/src/wishlist/wishlist.service.spec.ts`
   - `toggleAddsProductWhenNotPresent()`: upsert creates new row
   - `toggleIsIdempotentWhenAlreadyPresent()`: second upsert returns existing row without error
   - `removeDeletesWishlistEntry()`: DELETE removes the row; returns 204
   - `findAllReturnsProductDetailsForUser()`: returns array with product name, image, price, stockStatus
   - **Coverage Target**: 95%
2. **Integration**: `apps/api/src/wishlist/wishlist.controller.spec.ts`
   - `GET /wishlist/check/:productId` returns `{ inWishlist: true }` when product is saved
   - `DELETE /wishlist/:productId` on non-existent entry returns 204 (idempotent)
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/api/src/wishlist/wishlist.module.ts` importing PrismaService and registering controller
2. Create `apps/api/src/wishlist/wishlist.service.ts` with methods: `toggle(userId, productId)`, `remove(userId, productId)`, `findAll(userId)`, `check(userId, productId)`
3. Create `apps/api/src/wishlist/wishlist.controller.ts` with routes: `POST /:productId`, `DELETE /:productId`, `GET /`, `GET /check/:productId` — all guarded by CustomerAuthGuard
4. Register WishlistModule in `apps/api/src/app.module.ts`

---

### T-003: Build Wishlist UI — Add to Wishlist button (customer web)

**User Story**: US-001
**Satisfies ACs**: AC-US1-01, AC-US1-05
**Status**: [x] completed

**Test Plan**:
- **Given** a logged-in customer viewing a product page
- **When** they click "Add to Wishlist"
- **Then** the button switches to a filled/active state and the product is saved (POST `/wishlist/:productId`)
- **Given** an unauthenticated visitor clicking "Add to Wishlist"
- **When** the click handler fires
- **Then** the user is redirected to `/login?returnUrl=/products/:slug`

**Test Cases**:
1. **Unit**: `apps/web/src/components/wishlist-button.test.tsx`
   - `rendersAddStateWhenNotInWishlist()`: shows "Add to Wishlist" with unfilled heart icon
   - `rendersRemoveStateWhenInWishlist()`: shows "Saved" with filled heart icon
   - `redirectsToLoginWhenUnauthenticated()`: calls `router.push('/login?returnUrl=...')` when no session
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/web/src/components/wishlist-button.tsx` — accepts `productId`, `initialInWishlist` props; calls `POST /wishlist/:productId` on click; toggles UI state optimistically
2. Use `useSession()` to detect auth state; redirect to login with `returnUrl` if unauthenticated
3. Mount `WishlistButton` on the product detail page (`apps/web/src/app/products/[slug]/page.tsx`), passing `initialInWishlist` from a server-side `GET /wishlist/check/:productId` call

---

### T-004: Build Wishlist page (customer account)

**User Story**: US-001
**Satisfies ACs**: AC-US1-02, AC-US1-03, AC-US1-04
**Status**: [x] completed

**Test Plan**:
- **Given** a logged-in customer with wishlist items
- **When** they navigate to `/account/wishlist`
- **Then** all saved products are displayed with name, image, price, and stock status
- **Given** a customer who clicks "Remove" on an item
- **When** the DELETE request completes
- **Then** the item disappears from the list immediately (optimistic update)

**Test Cases**:
1. **Unit**: `apps/web/src/app/account/wishlist/wishlist-page.test.tsx`
   - `displaysAllWishlistItems()`: renders product cards with name, image, price, stock status
   - `removesItemOptimistically()`: item removed from DOM before API response
   - `showsEmptyStateWhenNoItems()`: renders "Your wishlist is empty" message
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/web/src/app/account/wishlist/page.tsx` — server component that fetches `GET /wishlist` and passes items to client component
2. Create `apps/web/src/app/account/wishlist/wishlist-list.tsx` — client component managing remove state; renders product cards with name, image, price, stock badge, and Remove button
3. Route is protected by existing account layout auth guard

---

## User Story: US-002 - Admin Price Tier Management UI

**Linked ACs**: AC-US2-01, AC-US2-02, AC-US2-03, AC-US2-04, AC-US2-05
**Tasks**: 3 total, 3 completed

---

### T-005: Add price tier CRUD endpoints to admin products module

**User Story**: US-002
**Satisfies ACs**: AC-US2-02, AC-US2-03, AC-US2-04, AC-US2-05
**Status**: [x] completed

**Test Plan**:
- **Given** an admin creating a price tier with minQty=5, maxQty=10, price=50000
- **When** POST `/admin/products/:productId/price-tiers` is called
- **Then** the tier is created and returned with a 201 status
- **Given** an admin creating a tier with range 5-10 when a tier 8-15 already exists
- **When** the overlap check runs
- **Then** a 400 response is returned with a descriptive overlap error message

**Test Cases**:
1. **Unit**: `apps/api/src/admin/products/admin-products.service.spec.ts`
   - `createPriceTierSucceeds()`: valid non-overlapping range creates tier
   - `createPriceTierRejectsOverlap()`: overlapping range throws BadRequestException
   - `createPriceTierWithNullMaxQtyTreatedAsUnlimited()`: null maxQty overlaps correctly against existing finite ranges
   - `updatePriceTierExcludesSelfFromOverlapCheck()`: editing a tier's own range does not flag as overlap
   - `deletePriceTierRemovesCorrectRow()`: deletes by tierId and productId, returns 204
   - **Coverage Target**: 95%
2. **Integration**: `apps/api/src/admin/products/admin-products.controller.spec.ts`
   - `GET /admin/products/:productId/price-tiers` returns existing tiers in ascending minQty order
   - `DELETE /admin/products/:productId/price-tiers/:tierId` on non-existent ID returns 404
   - **Coverage Target**: 85%

**Implementation**:
1. Extend `apps/api/src/admin/products/admin-products.service.ts` with: `getPriceTiers(productId)`, `createPriceTier(productId, dto)`, `updatePriceTier(productId, tierId, dto)`, `deletePriceTier(productId, tierId)`
2. Add overlap detection helper using algorithm from plan.md AD-2: `rangesOverlap(a1, a2, b1, b2)` where null maxQty = Infinity
3. Add DTOs: `CreatePriceTierDto`, `UpdatePriceTierDto` with class-validator decorators (minQty: positive int, maxQty: optional positive int, price: positive int)
4. Extend `apps/api/src/admin/products/admin-products.controller.ts` with four new routes (GET/POST/PUT/DELETE under `/:productId/price-tiers`)

---

### T-006: Build PriceTierEditor inline component (admin)

**User Story**: US-002
**Satisfies ACs**: AC-US2-01, AC-US2-02, AC-US2-03, AC-US2-04, AC-US2-05
**Status**: [x] completed

**Test Plan**:
- **Given** the admin product edit page loads
- **When** price tiers exist for the product
- **Then** they are listed in a table showing minQty, maxQty ("unlimited" when null), and price in VND
- **Given** the admin clicks "Add tier" and fills in valid values
- **When** they click "Save"
- **Then** the new row appears in the table and the API call returns 201

**Test Cases**:
1. **Unit**: `apps/admin/src/app/(dashboard)/products/[id]/price-tiers-editor.test.tsx`
   - `rendersExistingTiersWithUnlimitedLabel()`: maxQty null displays "Unlimited"
   - `addTierRowAppendsEmptyInputRow()`: clicking "Add tier" shows inline input fields
   - `saveTierCallsCreateEndpoint()`: save triggers POST and updates list
   - `editTierCallsUpdateEndpoint()`: editing saves via PUT
   - `deleteTierCallsDeleteEndpoint()`: delete button calls DELETE and removes row
   - `showsValidationErrorOnOverlap()`: API 400 response renders error toast/inline message
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/admin/src/app/(dashboard)/products/[id]/price-tiers-editor.tsx` — client component with editable table rows
2. "Add tier" appends a new empty row with minQty/maxQty/price inputs and Save/Cancel buttons
3. Existing rows show Edit/Delete icons; Edit toggles the row to input mode
4. All mutations call the corresponding API endpoint; show loading state on the row during save
5. Mount PriceTierEditor in `apps/admin/src/app/(dashboard)/products/[id]/page.tsx` below the existing product fields

---

### T-007: [P] Price tier overlap validation edge-case tests

**User Story**: US-002
**Satisfies ACs**: AC-US2-05
**Status**: [x] completed

**Test Plan**:
- **Given** various overlapping and non-overlapping range combinations including null maxQty
- **When** the `rangesOverlap` helper is evaluated
- **Then** it returns the correct boolean for all cases including adjacent (non-overlapping) ranges and unlimited tiers

**Test Cases**:
1. **Unit**: `apps/api/src/admin/products/price-tier-overlap.spec.ts`
   - `adjacentRangesDoNotOverlap()`: [1,5] and [6,10] → false
   - `overlappingRangesDetected()`: [1,10] and [5,15] → true
   - `unlimitedRangeOverlapsFiniteRange()`: [10,null] and [8,20] → true
   - `unlimitedRangesOverlapEachOther()`: [5,null] and [10,null] → true
   - `singleQtyRangesAtBoundary()`: [5,5] and [6,6] → false
   - **Coverage Target**: 100%

**Implementation**:
1. Extract `rangesOverlap` into `apps/api/src/admin/products/price-tier-overlap.util.ts`
2. Write unit tests in `apps/api/src/admin/products/price-tier-overlap.spec.ts`
3. Import util in `admin-products.service.ts`

---

## User Story: US-003 - Average Order Value Analytics

**Linked ACs**: AC-US3-01, AC-US3-02, AC-US3-03, AC-US3-04
**Tasks**: 3 total, 3 completed

---

### T-008: Add AOV-by-channel analytics endpoint

**User Story**: US-003
**Satisfies ACs**: AC-US3-01, AC-US3-02, AC-US3-03, AC-US3-04
**Status**: [x] completed

**Test Plan**:
- **Given** orders with different channels exist in the DB
- **When** GET `/admin/analytics/aov-by-channel` is called with a date range
- **Then** the response includes per-channel AOV, order count, revenue, and an overallAov summary
- **Given** a request with `granularity=daily`
- **When** the endpoint handles it
- **Then** the timeSeries array is populated with period, channel, and aov fields

**Test Cases**:
1. **Unit**: `apps/api/src/admin/analytics/admin-analytics.service.spec.ts`
   - `aovByChannelReturnsCorrectAverages()`: manual calculation matches returned AOV per channel
   - `aovByChannelFiltersDateRange()`: orders outside the range are excluded
   - `aovByChannelTimeSeriesGroupsByDay()`: granularity=daily groups rows by date
   - `aovByChannelOverallAovMatchesCrossChannelAverage()`: overallAov = totalRevenue / totalOrders
   - **Coverage Target**: 95%
2. **Integration**: `apps/api/src/admin/analytics/admin-analytics.controller.spec.ts`
   - Request without dateFrom/dateTo returns full dataset (no filter applied)
   - Invalid granularity value returns 400
   - **Coverage Target**: 85%

**Implementation**:
1. Extend `apps/api/src/admin/analytics/admin-analytics.service.ts` with `aovByChannel(dateFrom?, dateTo?, granularity?)` method
2. Use `prisma.order.groupBy({ by: ['channel'] })` with `_avg: { total: true }`, `_sum: { total: true }`, `_count: true` for channel breakdown
3. For time-series, use raw SQL with `DATE_TRUNC` following existing `revenueOverTime` pattern; whitelist granularity against `ALLOWED_UNITS` constant
4. Add `GET /analytics/aov-by-channel` route to `admin-analytics.controller.ts` with query param validation

---

### T-009: Build AOV chart component (admin analytics page)

**User Story**: US-003
**Satisfies ACs**: AC-US3-01, AC-US3-02, AC-US3-03, AC-US3-04
**Status**: [x] completed

**Test Plan**:
- **Given** the admin analytics page loads
- **When** the AOV section renders with data
- **Then** a bar chart shows AOV per channel alongside a summary card with overallAov
- **Given** the admin changes the time period selector to "weekly"
- **When** the selection changes
- **Then** a new API request is made with `granularity=weekly` and the chart updates

**Test Cases**:
1. **Unit**: `apps/admin/src/app/(dashboard)/analytics/aov-chart.test.tsx`
   - `rendersSummaryCardWithOverallAov()`: overallAov metric card is visible
   - `rendersBarChartWithChannelLabels()`: website, shopee, tiktok, facebook, other are represented
   - `granularitySelectorTriggersRefetch()`: changing dropdown refetches with new granularity param
   - `dateRangeFilterUpdatesChart()`: changing date range triggers new API call
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/admin/src/app/(dashboard)/analytics/aov-chart.tsx` — client component
2. Use existing charting library (recharts if already present); bar chart with channel on x-axis, AOV on y-axis
3. Summary card above chart showing overallAov, totalOrders, totalRevenue
4. Granularity selector (daily/weekly/monthly) and date range picker wired to refetch
5. Mount AovChart in existing analytics page component

---

### T-010: [P] AOV analytics integration test with seeded data

**User Story**: US-003
**Satisfies ACs**: AC-US3-01, AC-US3-04
**Status**: [x] completed

**Test Plan**:
- **Given** 10 seeded orders: 5 via "website" (total=100000 each) and 5 via "shopee" (total=200000 each)
- **When** the AOV endpoint is called without filters
- **Then** website AOV = 100000, shopee AOV = 200000, overallAov = 150000

**Test Cases**:
1. **Integration**: `apps/api/src/admin/analytics/aov-by-channel.integration.spec.ts`
   - `aovCalculationMatchesManualExpectation()`: seeded data matches computed values within 1 VND
   - `overallAovIsWeightedByOrderCount()`: not a simple average of channel AOVs
   - **Coverage Target**: 90%

**Implementation**:
1. Create integration test file with test DB seed helper
2. Assert both per-channel and overall AOV values
3. Run as part of CI integration suite

---

## User Story: US-004 - Reseller Performance Analytics

**Linked ACs**: AC-US4-01, AC-US4-02, AC-US4-03, AC-US4-04, AC-US4-05
**Tasks**: 3 total, 3 completed

---

### T-011: Add reseller performance analytics endpoint

**User Story**: US-004
**Satisfies ACs**: AC-US4-01, AC-US4-03, AC-US4-04, AC-US4-05
**Status**: [x] completed

**Test Plan**:
- **Given** orders and commissions exist for two resellers within a date range
- **When** GET `/admin/analytics/reseller-performance?dateFrom=&dateTo=` is called
- **Then** each reseller entry shows revenue, commissionCost, orderCount, and conversionRate
- **Given** no date range is provided
- **When** the endpoint is called
- **Then** all-time data is returned

**Test Cases**:
1. **Unit**: `apps/api/src/admin/analytics/admin-analytics.service.spec.ts`
   - `resellerPerformanceReturnsBothResellers()`: two resellers each have correct row
   - `conversionRateIsResellerOrdersOverTotalOrders()`: ratio calculated correctly
   - `summaryTotalsMatchIndividualRowSums()`: totalCommissionPaid = sum of all commissionCost values
   - `dateFilterExcludesOrdersOutsideRange()`: orders outside range not included
   - **Coverage Target**: 95%
2. **Integration**: `apps/api/src/admin/analytics/admin-analytics.controller.spec.ts`
   - Endpoint returns 200 with correct shape
   - Empty reseller list returns `{ summary: {...}, resellers: [] }`
   - **Coverage Target**: 85%

**Implementation**:
1. Extend `admin-analytics.service.ts` with `resellerPerformance(dateFrom?, dateTo?)` method
2. Run two parallel Prisma queries (plan.md AD-4): `order.groupBy resellerId` + `commission.groupBy resellerId`
3. Join results in application code; fetch reseller names via `findMany` on Reseller model
4. Add `GET /analytics/reseller-performance` route to controller with date query params

---

### T-012: Build reseller performance table component (admin analytics)

**User Story**: US-004
**Satisfies ACs**: AC-US4-01, AC-US4-02, AC-US4-03, AC-US4-04, AC-US4-05
**Status**: [x] completed

**Test Plan**:
- **Given** the reseller performance section loads with data
- **When** rendered
- **Then** a table shows each reseller with revenue, commissionCost, orderCount columns; summary cards show totalCommissionPaid, totalResellerRevenue, avgCommissionRate
- **Given** the admin selects a date range
- **When** applied
- **Then** all metrics in the table and summary cards update

**Test Cases**:
1. **Unit**: `apps/admin/src/app/(dashboard)/analytics/reseller-performance.test.tsx`
   - `rendersResellerTableWithAllColumns()`: name, revenue, commission, orders, conversion rate visible
   - `rankingIndicatorHighlightsTopReseller()`: first row (highest revenue) has visual rank indicator
   - `summaryCardsDisplayCorrectTotals()`: summary card values match data
   - `dateRangeFilterRefetchesData()`: changing date range triggers API call
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/admin/src/app/(dashboard)/analytics/reseller-performance.tsx` — client component
2. Summary cards row: totalCommissionPaid, totalResellerRevenue, avgCommissionRate, conversion rate
3. Data table sorted by revenue descending; rank number column for top performers
4. Date range picker shared with AOV chart (lift to analytics page state)
5. Mount in existing analytics page

---

### T-013: [P] Reseller analytics integration test with seeded data

**User Story**: US-004
**Satisfies ACs**: AC-US4-01, AC-US4-05
**Status**: [x] completed

**Test Plan**:
- **Given** two resellers with known orders and commissions
- **When** the endpoint is called
- **Then** all values match manual calculations including avgCommissionRate

**Test Cases**:
1. **Integration**: `apps/api/src/admin/analytics/reseller-performance.integration.spec.ts`
   - `resellerMetricsMatchSeedData()`: revenue, commissions, counts all correct
   - `avgCommissionRateIsWeightedAverage()`: not a simple average of rates
   - **Coverage Target**: 90%

**Implementation**:
1. Create integration test with seeded Reseller, Order, Commission rows
2. Assert all response fields against known values

---

## User Story: US-005 - Shareable Coupon Links for Resellers

**Linked ACs**: AC-US5-01, AC-US5-02, AC-US5-03, AC-US5-04, AC-US5-05
**Tasks**: 3 total, 3 completed

---

### T-014: Add Copy Link button to reseller coupon page

**User Story**: US-005
**Satisfies ACs**: AC-US5-01, AC-US5-05
**Status**: [x] completed

**Test Plan**:
- **Given** a reseller views their coupons page
- **When** the page loads
- **Then** each coupon shows a "Copy Link" button and a usage count
- **Given** the reseller clicks "Copy Link" on a coupon with code "SAVE20"
- **When** the clipboard API resolves
- **Then** the copied URL is `{origin}?coupon=SAVE20` and the button briefly shows "Copied!"

**Test Cases**:
1. **Unit**: `apps/web/src/app/reseller/coupons/coupon-card.test.tsx`
   - `copyLinkConstructsCorrectUrl()`: URL format is `${origin}?coupon=${code}`
   - `copyLinkButtonShowsCopiedFeedback()`: button label changes to "Copied!" for 2s then resets
   - `usageCountDisplaysFromExistingData()`: CouponUsage count rendered next to copy button
   - **Coverage Target**: 90%

**Implementation**:
1. Extend `apps/web/src/app/reseller/coupons/page.tsx` (or its coupon card sub-component) to add "Copy Link" button per coupon
2. Click handler: `navigator.clipboard.writeText(`${window.location.origin}?coupon=${code}`)` with async feedback state
3. Display `coupon.usageCount` (already available from existing reseller coupon endpoint) next to the button

---

### T-015: Implement useCouponFromUrl hook (customer web)

**User Story**: US-005
**Satisfies ACs**: AC-US5-02, AC-US5-03, AC-US5-04
**Status**: [x] completed

**Test Plan**:
- **Given** a customer visits `/?coupon=SAVE10`
- **When** the `useCouponFromUrl` hook runs
- **Then** `sessionStorage.setItem('pendingCoupon', 'SAVE10')` is called
- **Given** the coupon is already stored and the customer navigates to checkout
- **When** the checkout page mounts
- **Then** the coupon input is pre-filled with "SAVE10"
- **Given** the checkout form is submitted successfully
- **When** the order is placed
- **Then** `sessionStorage.removeItem('pendingCoupon')` is called

**Test Cases**:
1. **Unit**: `apps/web/src/hooks/use-coupon-from-url.test.ts`
   - `storesCouponFromQueryParamToSessionStorage()`: param present → sessionStorage written
   - `doesNothingWhenNoCouponParam()`: no param → sessionStorage unchanged
   - `checkoutPageReadsCouponFromSessionStorage()`: hook returns stored coupon on checkout page
   - `clearsCouponAfterSuccessfulOrder()`: `clearCoupon()` removes from sessionStorage
   - **Coverage Target**: 95%

**Implementation**:
1. Create `apps/web/src/hooks/use-coupon-from-url.ts` using `useSearchParams()` from Next.js
2. On mount: if `?coupon=` param present, write to `sessionStorage` (key: `pendingCoupon`)
3. Export `usePendingCoupon()` hook that reads sessionStorage and returns `{ coupon, clearCoupon }`
4. Mount `useCouponFromUrl` in root layout or a checkout layout component

---

### T-016: Pre-fill coupon on checkout from sessionStorage

**User Story**: US-005
**Satisfies ACs**: AC-US5-02, AC-US5-03, AC-US5-04
**Status**: [x] completed

**Test Plan**:
- **Given** `sessionStorage` has `pendingCoupon=SAVE10` and the coupon is valid
- **When** the checkout page renders
- **Then** the coupon input is pre-filled with "SAVE10" and the discount is applied automatically
- **Given** `pendingCoupon=INVALID` is in sessionStorage
- **When** the coupon is validated by the existing API
- **Then** an error message informs the customer the coupon is invalid and checkout proceeds without discount

**Test Cases**:
1. **Unit**: `apps/web/src/app/checkout/checkout-coupon-field.test.tsx`
   - `prefillsInputFromSessionStorage()`: field value matches stored coupon on mount
   - `autoValidatesPrefilledCoupon()`: triggers coupon validation API call on mount when pre-filled
   - `showsErrorOnInvalidCoupon()`: API 400 response displays inline error message
   - `clearsSessionStorageAfterOrderPlaced()`: `clearCoupon()` called in order success handler
   - **Coverage Target**: 90%

**Implementation**:
1. In the checkout page coupon field component, call `usePendingCoupon()` and set the initial input value
2. On mount, if a pending coupon is present, auto-trigger validation via existing coupon validation API
3. Pass `clearCoupon` to the order submission handler to clear after success
4. Invalid coupon shows existing checkout error UI — no new error pattern needed

---

## User Story: US-006 - Bulk Print Invoices

**Linked ACs**: AC-US6-01, AC-US6-02, AC-US6-03, AC-US6-04, AC-US6-05
**Tasks**: 4 total, 4 completed

---

### T-017: Add bulk invoice HTML endpoint to admin orders

**User Story**: US-006
**Satisfies ACs**: AC-US6-01, AC-US6-02, AC-US6-03, AC-US6-04
**Status**: [x] completed

**Test Plan**:
- **Given** an admin requests GET `/admin/orders/invoices?ids=id1,id2`
- **When** the endpoint handles it
- **Then** an HTML document is returned (Content-Type: text/html) containing invoice data for both orders
- **Given** more than 50 order IDs are passed
- **When** the endpoint validates the request
- **Then** a 400 response is returned with an error message

**Test Cases**:
1. **Unit**: `apps/api/src/admin/orders/admin-orders.service.spec.ts`
   - `renderInvoicesReturnsHtmlString()`: result is a string starting with `<!DOCTYPE html>`
   - `renderInvoicesIncludesAllRequiredFields()`: order number, date, customer name, phone, email, address, line items, subtotal, discount, coupon code, shipping, total all present
   - `renderInvoicesRejectsMoreThan50Ids()`: throws BadRequestException for 51+ IDs
   - `renderInvoicesHandlesOrdersWithNoCoupon()`: coupon row absent when not applied
   - **Coverage Target**: 95%
2. **Integration**: `apps/api/src/admin/orders/admin-orders.controller.spec.ts`
   - `GET /admin/orders/invoices?ids=` with empty ids returns 400
   - Response Content-Type is `text/html`
   - **Coverage Target**: 85%

**Implementation**:
1. Extend `apps/api/src/admin/orders/admin-orders.service.ts` with `renderInvoices(ids: string[])` method
2. Single `prisma.order.findMany({ where: { id: { in: ids } }, include: { items: { include: { product: true } }, address: true } })`
3. Build HTML string with `page-break-before: always` between invoices (first invoice has no page-break)
4. Add `GET /orders/invoices` route to `admin-orders.controller.ts`; validate max 50 IDs; respond with `.type('text/html').send(html)`

---

### T-018: Invoice HTML template with print CSS

**User Story**: US-006
**Satisfies ACs**: AC-US6-02, AC-US6-03, AC-US6-05
**Status**: [x] completed

**Test Plan**:
- **Given** an invoice HTML template is rendered for a sample order
- **When** the HTML is parsed
- **Then** all AC-US6-02 fields are present in the DOM
- **Given** the CSS is applied to a viewport-based rendering
- **When** `@media print` is active
- **Then** `page-break-before: always` is set on each invoice block except the first

**Test Cases**:
1. **Unit**: `apps/api/src/admin/orders/invoice-template.spec.ts`
   - `templateContainsOrderNumber()`: order.number present in output
   - `templateContainsLineItemsTable()`: each order item has row with name, qty, unit price, subtotal
   - `templateContainsCouponRowOnlyWhenApplied()`: coupon row absent for orders without coupon
   - `templatePageBreakPresentOnSecondInvoice()`: second invoice block has page-break CSS class
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/api/src/admin/orders/invoice-template.ts` — pure function `buildInvoiceHtml(orders: OrderWithDetails[]): string`
2. Template structure: outer `<html>` with `<style>` block containing `@media print { .invoice + .invoice { page-break-before: always } }`
3. Each invoice is a `<div class="invoice">` containing all required fields
4. VND formatting: display prices as integer with `₫` symbol
5. Import and call from `renderInvoices` in admin-orders.service.ts

---

### T-019: Add "Print Invoices" to admin order bulk actions

**User Story**: US-006
**Satisfies ACs**: AC-US6-01, AC-US6-04
**Status**: [x] completed

**Test Plan**:
- **Given** the admin selects 3 orders in the order list and opens the bulk actions dropdown
- **When** "Print Invoices" is clicked
- **Then** a new browser tab opens with the URL `/admin/orders/invoices?ids=id1,id2,id3`
- **Given** the admin selects more than 50 orders
- **When** "Print Invoices" is clicked
- **Then** a warning toast is shown: "Please select 50 or fewer orders for printing"

**Test Cases**:
1. **Unit**: `apps/admin/src/app/(dashboard)/orders/page.test.tsx`
   - `printInvoicesOpensNewTab()`: `window.open` called with correct URL containing all selected IDs
   - `printInvoicesShowsWarningOver50()`: toast shown when selection exceeds 50
   - `printInvoicesDisabledWhenNoneSelected()`: button is disabled/absent when no rows selected
   - **Coverage Target**: 90%

**Implementation**:
1. Extend the bulk actions dropdown in `apps/admin/src/app/(dashboard)/orders/page.tsx` with "Print Invoices" option
2. Click handler: if selectedIds.length > 50, show warning toast and return; else `window.open(`${API_BASE}/admin/orders/invoices?ids=${selectedIds.join(',')}`, '_blank')`
3. JWT cookie is included automatically since the new tab is same-origin

---

### T-020: [P] Invoice print layout visual test

**User Story**: US-006
**Satisfies ACs**: AC-US6-05
**Status**: [x] completed

**Test Plan**:
- **Given** a generated invoice HTML page for a sample order with long line items
- **When** viewed at A4 dimensions (794x1123px)
- **Then** all content fits within the page width without horizontal overflow

**Test Cases**:
1. **E2E**: `apps/admin/e2e/invoice-print.spec.ts` (Playwright)
   - `invoiceContentFitsA4Width()`: page width set to 794px; no element with scrollWidth > clientWidth
   - `multipleInvoicesHavePageBreaks()`: computed style of second invoice block has `page-break-before: always`
   - **Coverage Target**: 100% of AC scenarios

**Implementation**:
1. Create Playwright test that hits the invoice endpoint with seeded order IDs
2. Set viewport to 794x1123 (A4 at 96dpi)
3. Assert no horizontal overflow and presence of page-break styles on invoice divs

---

## Coverage Summary

| User Story | Tasks | ACs Covered |
|------------|-------|-------------|
| US-001 Wishlist | T-001 to T-004 | AC-US1-01 through AC-US1-05 |
| US-002 Price Tier UI | T-005 to T-007 | AC-US2-01 through AC-US2-05 |
| US-003 AOV Analytics | T-008 to T-010 | AC-US3-01 through AC-US3-04 |
| US-004 Reseller Analytics | T-011 to T-013 | AC-US4-01 through AC-US4-05 |
| US-005 Shareable Links | T-014 to T-016 | AC-US5-01 through AC-US5-05 |
| US-006 Bulk Invoices | T-017 to T-020 | AC-US6-01 through AC-US6-05 |

**Total**: 20 tasks covering all 27 acceptance criteria.
