# Architecture Plan: 0007-feature-enhancements

## Overview

Six feature gaps to close across three system layers: customer-facing (wishlist, shareable links), admin backend/frontend (price tier UI, AOV analytics, reseller analytics, bulk invoices). The existing codebase already contains all prerequisite models, services, and routing patterns. This plan extends them with minimal new surface area.

---

## Architecture Decisions

### AD-1: Wishlist Model

**Decision**: Add a `Wishlist` Prisma model with a `@@unique([userId, productId])` compound constraint. Expose via customer-facing REST endpoints under `/wishlist` (not admin-scoped).

**Schema**:
```
model Wishlist {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  productId String   @map("product_id")
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now()) @map("created_at")

  @@unique([userId, productId])
  @@map("wishlists")
}
```

**Rationale**: A dedicated join table is cleaner than a JSON array on User. The unique constraint prevents duplicates at the DB level and enables simple toggle semantics (add/remove idempotently). Cascade deletes handle user or product removal.

**API Endpoints** (customer auth required):
- `POST /wishlist/:productId` -- toggle add (idempotent upsert)
- `DELETE /wishlist/:productId` -- remove
- `GET /wishlist` -- list all wishlist items with product details
- `GET /wishlist/check/:productId` -- quick boolean check for UI state

**Relations to add**: `wishlists Wishlist[]` on both `User` and `Product` models.

### AD-2: Price Tier Management (Admin)

**Decision**: Add CRUD endpoints for price tiers scoped to a product under the existing admin products module. No new NestJS module needed. The admin frontend renders an inline editable table within the existing product edit page.

**API Endpoints** (admin auth via `AdminGuard`):
- `GET /admin/products/:productId/price-tiers` -- list tiers (already available via `findOne` include)
- `POST /admin/products/:productId/price-tiers` -- create tier
- `PUT /admin/products/:productId/price-tiers/:tierId` -- update tier
- `DELETE /admin/products/:productId/price-tiers/:tierId` -- delete tier

**Validation**: Server-side overlap detection. On create/update, query existing tiers for the product and check if the new `[minQty, maxQty]` range overlaps any existing range. Return 400 with descriptive error on overlap.

**Overlap algorithm**: Two ranges `[a1, a2]` and `[b1, b2]` overlap if `a1 <= (b2 ?? Infinity) AND b1 <= (a2 ?? Infinity)`, excluding the tier being edited.

**Frontend approach**: Inline table rows with edit/delete buttons. "Add tier" appends an empty row. Saves are individual API calls per tier (not batch), which is simpler and avoids partial-failure complexity. Optimistic UI is unnecessary since tier changes are infrequent admin operations -- standard loading states suffice.

### AD-3: AOV Analytics by Channel

**Decision**: Extend `AdminAnalyticsService` with a new `aovByChannel()` method. Reuse the existing `buildDateFilter` pattern and `groupBy` approach already used by `revenueByChannel`. Add a corresponding controller endpoint.

**API Endpoint**:
- `GET /admin/analytics/aov-by-channel?dateFrom=&dateTo=&granularity=daily|weekly|monthly`

**Response shape**:
```typescript
{
  summary: { overallAov: number; totalOrders: number; totalRevenue: number };
  channels: Array<{ channel: string; aov: number; orderCount: number; revenue: number }>;
  timeSeries?: Array<{ period: string; channel: string; aov: number }>; // when granularity provided
}
```

**Query strategy**: Use `prisma.order.groupBy({ by: ['channel'] })` with `_avg: { total: true }` and `_sum`/`_count` for the channel breakdown. For the time-series variant with granularity, use a raw SQL query following the existing `revenueOverTime` pattern with `DATE_TRUNC`. This avoids loading full order datasets client-side (per spec constraint).

### AD-4: Reseller Performance Analytics

**Decision**: Add a new `resellerPerformance()` method to `AdminAnalyticsService` and a corresponding endpoint. Data is sourced from `Commission` and `Order` tables joined through `resellerId`.

**API Endpoint**:
- `GET /admin/analytics/reseller-performance?dateFrom=&dateTo=`

**Response shape**:
```typescript
{
  summary: {
    totalCommissionPaid: number;
    totalResellerRevenue: number;
    avgCommissionRate: number;
    resellerOrderCount: number;
    totalOrderCount: number;
  };
  resellers: Array<{
    resellerId: string;
    resellerName: string;
    revenue: number;
    commissionCost: number;
    orderCount: number;
    conversionRate: number; // reseller orders / total orders in period
  }>;
}
```

**Query strategy**: Two queries in parallel:
1. `prisma.order.groupBy({ by: ['resellerId'] })` filtered to non-null resellerId, with `_sum: { total }` and `_count`.
2. `prisma.commission.groupBy({ by: ['resellerId'] })` with `_sum: { commissionAmount }`.
Join results in application code. Fetch reseller names with a follow-up `findMany` on the Reseller model (same pattern as `topProducts`).

### AD-5: Shareable Coupon Links

**Decision**: Pure client-side URL construction in the reseller portal. No new backend endpoints for link generation. The customer-facing site reads the `?coupon=CODE` query parameter via a Next.js client-side hook (not middleware).

**Why a client hook instead of middleware**:
- Middleware runs on every request and would add overhead for a single-purpose query param.
- A `useCouponFromUrl` hook in the checkout flow is simpler, testable, and colocated with the coupon logic.
- The hook reads the param from `useSearchParams()`, stores it in `sessionStorage` (persists across navigation until checkout or tab close), and pre-fills the coupon input on the checkout page.

**Reseller portal changes**:
- On the coupons page, add a "Copy Link" button per coupon that constructs `${window.location.origin}?coupon=${code}` and copies to clipboard.
- Usage tracking: Display `CouponUsage` count for each coupon (data already available from existing reseller coupon endpoints).

**Customer-facing flow**:
1. User visits `shopvui.com?coupon=SAVE10`
2. `useCouponFromUrl` hook (in root layout or checkout layout) reads param, stores in `sessionStorage`
3. On checkout page, coupon input is pre-filled from `sessionStorage`
4. After successful order or explicit removal, `sessionStorage` entry is cleared

### AD-6: Bulk Print Invoices

**Decision**: Server-side HTML template rendered by a new API endpoint. The admin frontend opens the rendered HTML in a new browser tab for printing.

**API Endpoint**:
- `GET /admin/orders/invoices?ids=id1,id2,...id50`

**Response**: HTML document (Content-Type: text/html) with CSS `@media print` styles and `page-break-before: always` between invoices.

**Why server-rendered HTML over client-rendered**:
- The admin frontend would need to fetch all order details and construct the layout. A server endpoint has direct DB access and can render a complete, self-contained HTML document.
- No PDF library needed (spec explicitly marks PDF generation as out of scope).
- Browser print dialog handles PDF export natively.

**Invoice template fields** (per AC-US6-02): order number, order date, customer name, phone, email, shipping address, line items (product name, qty, unit price, subtotal), order subtotal, discount amount, coupon code, shipping fee, total.

**Guard rails**:
- Request validation: max 50 order IDs per request (return 400 if exceeded).
- Query: single `prisma.order.findMany` with `include` for items, product names, and address. One DB round-trip.

**Frontend integration**: Add "Print Invoices" option to the existing bulk actions dropdown in the orders list (alongside "Mark Shipped" and "Export CSV"). On click, open `${API_BASE}/admin/orders/invoices?ids=...` in a new tab. The JWT cookie authenticates the request.

---

## Component Boundaries

### Backend (apps/api/src/)

| Component | Action | Files |
|-----------|--------|-------|
| Wishlist module | **NEW** | `wishlist/wishlist.module.ts`, `wishlist.service.ts`, `wishlist.controller.ts` |
| Admin products | **EXTEND** | `admin/products/admin-products.controller.ts`, `admin-products.service.ts` (add price tier CRUD) |
| Admin analytics | **EXTEND** | `admin/analytics/admin-analytics.service.ts`, `admin-analytics.controller.ts` (add AOV + reseller perf) |
| Admin orders | **EXTEND** | `admin/orders/admin-orders.controller.ts`, `admin-orders.service.ts` (add invoice HTML endpoint) |

### Database (packages/db/prisma/)

| Change | Detail |
|--------|--------|
| New model | `Wishlist` with userId+productId unique constraint |
| Relations | Add `wishlists` relation to `User` and `Product` models |
| Migration | Single migration: `add_wishlist_model` |

### Frontend - Customer (apps/web/src/)

| Component | Action | Location |
|-----------|--------|----------|
| Wishlist button | **NEW** | Component used on product pages, calls `/wishlist/:productId` |
| Wishlist page | **NEW** | `app/account/wishlist/page.tsx` |
| Coupon URL hook | **NEW** | `hooks/use-coupon-from-url.ts` (reads `?coupon=` param, stores in sessionStorage) |
| Checkout coupon prefill | **EXTEND** | Checkout page reads sessionStorage for pre-applied coupon |

### Frontend - Reseller (apps/web/src/app/reseller/)

| Component | Action | Location |
|-----------|--------|----------|
| Copy link button | **EXTEND** | `coupons/page.tsx` -- add clipboard copy per coupon |
| Usage count display | **EXTEND** | Show coupon usage count from existing data |

### Frontend - Admin (apps/admin/src/app/(dashboard)/)

| Component | Action | Location |
|-----------|--------|----------|
| Price tier editor | **NEW** | `products/[id]/price-tiers-editor.tsx` (inline table in product edit) |
| AOV chart | **NEW** | `analytics/aov-chart.tsx` (bar chart by channel + summary card) |
| Reseller perf table | **NEW** | `analytics/reseller-performance.tsx` (table + summary cards) |
| Invoice bulk action | **EXTEND** | `orders/page.tsx` -- add "Print Invoices" to bulk actions dropdown |

---

## Data Flow Diagrams

### Wishlist Flow
```
Product Page --> POST /wishlist/:productId --> WishlistService.toggle()
                                               --> prisma.wishlist.upsert / delete
Account Page --> GET /wishlist --> WishlistService.findAll(userId)
                                   --> prisma.wishlist.findMany + product include
```

### Coupon Link Flow
```
Reseller Portal: Copy "{origin}?coupon=CODE" to clipboard
  |
Customer visits URL --> useCouponFromUrl hook --> sessionStorage.set("coupon", CODE)
  |
Checkout page --> reads sessionStorage --> pre-fills coupon input --> validates via existing coupon API
  |
Order placed (or user clears) --> sessionStorage.remove("coupon")
```

### Invoice Flow
```
Admin Orders List --> Select orders --> "Print Invoices" bulk action
  |
Browser opens new tab: GET /admin/orders/invoices?ids=...
  |
AdminOrdersService.renderInvoices(ids) --> prisma.order.findMany (with items, address)
  --> HTML template with @media print CSS --> Browser print dialog
```

---

## Implementation Order

The six features are largely independent. Recommended sequence based on dependency and complexity:

1. **Wishlist** (US-001) -- New model + migration must come first since it touches schema
2. **Price Tier CRUD** (US-002) -- Backend extension only, no schema change
3. **AOV Analytics** (US-003) -- Backend extension, pairs well with next item
4. **Reseller Analytics** (US-004) -- Backend extension, similar query patterns
5. **Shareable Links** (US-005) -- Mostly frontend, minimal backend
6. **Bulk Invoices** (US-006) -- Self-contained HTML rendering, good to do last

Features 2-6 can be parallelized across subagents if desired, since they touch different modules.

---

## Risk Mitigations

| Risk | Mitigation |
|------|------------|
| Wishlist N+1 queries on product page | Single `findUnique` check per product; batch check endpoint for list views |
| Price tier overlap validation edge cases (null maxQty = unlimited) | Explicit algorithm treating null as Infinity; comprehensive test cases |
| AOV time-series raw SQL injection | Use same `ALLOWED_UNITS` whitelist pattern from existing `revenueOverTime` |
| Invoice HTML rendering performance at 50 orders | Single findMany with includes; static HTML (no JS); warn at >50 |
| sessionStorage coupon not persisting across tabs | Acceptable trade-off; coupon is in the URL, user can re-click the link |

---

## Technology Choices

No new dependencies required. All features use existing stack:
- **Backend**: NestJS + Prisma (existing patterns)
- **Frontend**: Next.js 15 App Router + React (existing patterns)
- **Charts**: Whatever charting library is already used in the admin analytics page; if none exists, recommend `recharts` as it is lightweight and React-native
- **Invoice HTML**: Plain HTML + CSS (`@media print`), no template engine needed -- use NestJS response with `.type('text/html').send(html)`

---

## Domain Skill Recommendations

After plan approval, the following domain skills should be invoked for implementation:

1. **`backend:nodejs`** -- For NestJS service/controller extensions (wishlist module, price tier CRUD, analytics queries, invoice endpoint)
2. **`frontend:architect`** -- For React component design (price tier editor, analytics charts, wishlist UI, coupon hook)

No additional domain skills needed. The scope is moderate (extending existing patterns, one new model) and does not warrant full-chain activation.
