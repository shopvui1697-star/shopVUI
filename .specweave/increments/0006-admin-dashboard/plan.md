# Architecture Plan: 0006 - Unified Admin Dashboard

## Overview

This plan covers the architecture for a unified admin dashboard that consolidates order management across sales channels, product/coupon/reseller/customer CRUD, CSV import for external orders, and analytics -- all behind role-based admin authentication.

**Architecture Decisions**:
- **ADR-0001**: Admin Role-Based Authentication -- UserRole enum on existing User model, AdminGuard, JWT role claim
- **ADR-0002**: Admin API Design Pattern -- Separate `/admin/*` modules in NestJS, not extending existing customer-facing modules

---

## Architecture

### Components

```
                    apps/admin (Next.js :3001)
                    ========================
                    middleware.ts (auth check)
                           |
                    Server Components
                           |
                    fetch() with JWT
                           |
                           v
                    apps/api (NestJS :3000)
                    =======================
                    JwtAuthGuard -> AdminGuard
                           |
                    Admin Controllers (/admin/*)
                           |
                    Admin Services
                           |
                    prisma (packages/db)
                           |
                           v
                      PostgreSQL
```

Key boundaries:
- **apps/admin** never imports `@shopvui/db` directly -- all data access through the NestJS API
- **Admin modules** in apps/api are separate from customer-facing modules (different services, controllers, DTOs)
- **packages/shared** is the single source of truth for types shared between frontend and API
- **packages/ui** provides base components; admin-specific components stay in apps/admin

### Data Model

#### 1. UserRole Enum and User.role Field

```prisma
enum UserRole {
  CUSTOMER
  ADMIN
  RESELLER
}

model User {
  // ... existing fields ...
  role UserRole @default(CUSTOMER)
}
```

Additive migration. Default value means no data backfill needed. Existing users become CUSTOMER implicitly.

#### 2. Order Model -- External Channel Fields

The Order model already has a `channel` field (default "website"). Add fields for external order tracking and guest customer info:

```prisma
model Order {
  // ... existing fields ...
  externalOrderId  String?  @map("external_order_id")
  customerName     String?  @map("customer_name")
  customerPhone    String?  @map("customer_phone")
  customerEmail    String?  @map("customer_email")

  // Make nullable for external orders:
  userId    String?  @map("user_id")    // was required
  user      User?    @relation(...)      // was required
  addressId String?  @map("address_id") // was required
  address   Address? @relation(...)      // was required

  @@index([channel])
  @@index([externalOrderId, channel])
}
```

External orders from Shopee/TikTok/Facebook may not map to registered users or stored addresses. The `customerName/Phone/Email` fields store the external customer info. A partial unique index on `(externalOrderId, channel) WHERE externalOrderId IS NOT NULL` prevents duplicate imports (applied via raw SQL migration since Prisma does not support conditional uniqueness).

#### 3. Commission Payout Status (if not in 0005)

```prisma
enum PayoutStatus {
  PENDING
  APPROVED
  PAID
}
```

### API Contracts

#### Admin Guard

```typescript
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    return true;
  }
}
```

Every admin controller uses `@UseGuards(JwtAuthGuard, AdminGuard)`.

#### Endpoint Summary

| Module | Method | Path | Description |
|--------|--------|------|-------------|
| Orders | GET | `/admin/orders` | List all orders (paginated, filterable by channel/status/date/payment/search) |
| Orders | GET | `/admin/orders/:id` | Order detail with items, customer, history, reseller attribution |
| Orders | PATCH | `/admin/orders/:id/status` | Update order status (validates state machine transitions) |
| Orders | POST | `/admin/orders/bulk` | Bulk actions: mark shipped, export CSV, print invoices |
| Products | GET | `/admin/products` | List products (filterable by category, searchable) |
| Products | POST | `/admin/products` | Create product with images, price tiers, category |
| Products | PUT | `/admin/products/:id` | Update product (all fields including images and tiers) |
| Products | DELETE | `/admin/products/:id` | Soft-delete product (set isActive=false) |
| Products | POST | `/admin/products/:id/images` | Upload images (multipart/form-data) |
| Coupons | GET | `/admin/coupons` | List coupons with usage stats (times used, total discount, revenue) |
| Coupons | POST | `/admin/coupons` | Create coupon |
| Coupons | PATCH | `/admin/coupons/:id` | Update coupon (toggle active, edit fields) |
| Coupons | PATCH | `/admin/coupons/:id/approval` | Approve/reject reseller coupon request |
| Resellers | GET | `/admin/resellers` | List resellers with status, order count, total revenue |
| Resellers | PATCH | `/admin/resellers/:id/status` | Approve/reject/suspend reseller |
| Resellers | PATCH | `/admin/resellers/:id/commission` | Set per-reseller commission rate |
| Resellers | GET | `/admin/resellers/payouts` | List commission payouts (filterable by status) |
| Resellers | PATCH | `/admin/resellers/payouts/:id` | Mark payout as approved/paid |
| Resellers | GET | `/admin/resellers/export` | Export commission report as CSV |
| Customers | GET | `/admin/customers` | List customers with name, email, order count, total spend, last order |
| Customers | GET | `/admin/customers/:id` | Customer detail with cross-channel purchase history |
| Analytics | GET | `/admin/analytics/revenue` | Revenue by channel (pie/bar) and over time (line chart) |
| Analytics | GET | `/admin/analytics/orders` | Order volume by channel for selected period |
| Analytics | GET | `/admin/analytics/products` | Top selling products ranked by units/revenue |
| Analytics | GET | `/admin/analytics/coupons` | Coupon performance: usage count, total discount, orders influenced |
| Imports | POST | `/admin/imports/orders` | Upload CSV file with channel selection |

#### Order Status State Machine

```
PENDING -> CONFIRMED -> SHIPPING -> DELIVERED
PENDING -> CANCELLED
SHIPPING -> RETURNED
```

Invalid transitions return 400 Bad Request.

#### Analytics Query Strategy

Use Prisma `groupBy()` and `aggregate()` for simple aggregations. For time-series grouping (daily/weekly/monthly), use `prisma.$queryRaw` with PostgreSQL `DATE_TRUNC()` since Prisma groupBy does not support date truncation natively.

```typescript
// Revenue by channel
prisma.order.groupBy({
  by: ['channel'],
  where: { createdAt: { gte: startDate, lte: endDate }, status: { not: 'CANCELLED' } },
  _sum: { total: true },
  _count: true,
});
```

#### CSV Import Design

- **Controller**: Accepts `multipart/form-data` with file + `channel` field
- **Service**: Streaming CSV parser (`csv-parse`) handles up to 10,000 rows without loading all into memory
- **Batching**: Rows inserted in batches of 100 per transaction
- **Deduplication**: Check `(externalOrderId, channel)` before insert; skip duplicates
- **Response shape**: `{ imported: number, skipped: number, errors: Array<{ row: number, reason: string }> }`
- **Channel stubs**: `ShopeeApiStub` and `TiktokApiStub` define interfaces for future API sync (no implementation)

---

## Technology Stack

- **Framework**: NestJS (API), Next.js 15 App Router (admin frontend)
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: JWT with role claim, httpOnly cookies on admin frontend
- **Charts**: Recharts (lightweight, React-native, D3-based)
- **CSV Parsing**: `csv-parse` (Node.js streaming parser)
- **File Upload**: Multer via `@nestjs/platform-express` (already available)
- **Image Storage**: Local filesystem with abstract adapter interface (S3/R2 ready)

### New Dependencies

| Package | Where | Purpose |
|---------|-------|---------|
| `csv-parse` | apps/api | Streaming CSV parser for order import |
| `recharts` | apps/admin | Charting library for analytics |

---

## NestJS Module Structure

```
apps/api/src/
  admin/
    admin.module.ts              # Umbrella module importing all sub-modules
    guards/
      admin.guard.ts             # Role-check guard (ADMIN only)
    orders/
      admin-orders.module.ts
      admin-orders.controller.ts
      admin-orders.service.ts
      dto/
        admin-order-filters.dto.ts
        update-order-status.dto.ts
        bulk-action.dto.ts
    products/
      admin-products.module.ts
      admin-products.controller.ts
      admin-products.service.ts
      dto/
        create-product.dto.ts
        update-product.dto.ts
    coupons/
      admin-coupons.module.ts
      admin-coupons.controller.ts
      admin-coupons.service.ts
      dto/
    resellers/
      admin-resellers.module.ts
      admin-resellers.controller.ts
      admin-resellers.service.ts
      dto/
    customers/
      admin-customers.module.ts
      admin-customers.controller.ts
      admin-customers.service.ts
    analytics/
      admin-analytics.module.ts
      admin-analytics.controller.ts
      admin-analytics.service.ts
    imports/
      admin-imports.module.ts
      admin-imports.controller.ts
      admin-imports.service.ts
      channel-stubs/
        shopee-api.stub.ts       # Interface for future Shopee API sync
        tiktok-api.stub.ts       # Interface for future TikTok API sync
```

## Admin Frontend Structure (Next.js 15)

```
apps/admin/src/
  app/
    layout.tsx                   # Root layout
    page.tsx                     # Redirect to /orders or dashboard summary
    login/
      page.tsx                   # Admin login page (Google OAuth)
    (dashboard)/
      layout.tsx                 # Dashboard layout: sidebar + header
      orders/
        page.tsx                 # Order list with channel/status/date filters
        [id]/
          page.tsx               # Order detail + status management
      products/
        page.tsx                 # Product list
        new/
          page.tsx               # Create product form
        [id]/
          edit/
            page.tsx             # Edit product form
      coupons/
        page.tsx                 # Coupon list + create/edit/approve
      resellers/
        page.tsx                 # Reseller list + management
        payouts/
          page.tsx               # Payout management
      customers/
        page.tsx                 # Customer list
        [id]/
          page.tsx               # Customer detail + purchase history
      analytics/
        page.tsx                 # Charts: revenue, orders, products, coupons
      imports/
        page.tsx                 # CSV import page
  lib/
    api.ts                       # Fetch wrapper with JWT auth headers
    auth.ts                      # Login, logout, token refresh utilities
    constants.ts                 # Status labels, channel names, color maps
  components/
    sidebar.tsx                  # Navigation sidebar with route links
    header.tsx                   # Top bar with user info + logout
    data-table.tsx               # Reusable sortable/filterable/paginated table
    status-badge.tsx             # Colored badges for order/reseller status
    chart-wrapper.tsx            # Recharts wrapper components
    file-upload.tsx              # CSV and image upload component
    pagination.tsx               # Pagination controls
  middleware.ts                  # Route protection: check JWT cookie + role
```

### Admin Auth Flow

1. User navigates to `/admin` -> Next.js middleware checks for JWT cookie
2. No cookie -> redirect to `/login`
3. Login page initiates Google OAuth -> NestJS returns JWT with `role` claim
4. Middleware reads JWT; if `role !== 'ADMIN'` -> 403 page
5. JWT stored in httpOnly cookie; auto-refreshed
6. All API calls include `Authorization: Bearer <token>` via `lib/api.ts`

### Data Fetching Pattern

Server Components for initial page loads with `fetch()` to NestJS API. Client Components for interactive elements (filters, forms, charts).

---

## Shared Types (packages/shared)

### Updated AuthUser

```typescript
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: 'CUSTOMER' | 'ADMIN' | 'RESELLER';
}
```

### New Admin Types (packages/shared/src/admin.ts)

- `AdminOrderListItem`, `AdminOrderDetail`, `AdminOrderFilters`
- `AdminProductForm`, `AdminProductListItem`
- `AdminCouponListItem`, `AdminCouponForm`
- `AdminResellerListItem`, `AdminPayoutListItem`
- `AdminCustomerListItem`, `AdminCustomerDetail`
- `AnalyticsRevenueByChannel`, `AnalyticsRevenueOverTime`, `AnalyticsTopProducts`, `AnalyticsCouponPerformance`
- `CsvImportResult`
- `OrderStatusTransition`

---

## Implementation Phases

### Phase 1: Foundation
1. Prisma schema migration (UserRole enum, User.role, Order optional fields, externalOrderId, indexes)
2. Auth changes (JWT payload includes role, AdminGuard, AuthUser type update)
3. Admin app scaffolding (root layout, sidebar, middleware, login flow, api client)

### Phase 2: Core Functionality
4. Admin Orders API + UI (list with filters, detail, status transitions, bulk actions)
5. CSV Import API + UI (upload, streaming parse, dedup, error report)
6. Product Management API + UI (CRUD, image upload, price tiers, categories)

### Phase 3: Management and Analytics
7. Coupon Management API + UI (CRUD, reseller approval, usage stats)
8. Reseller Management API + UI (list, approval, commission rates, payouts, CSV export)
9. Customer Management API + UI (list with aggregated stats, detail with cross-channel history)
10. Analytics API + UI (revenue/orders/products/coupons charts with Recharts)

---

## Testing Strategy

- **Unit tests**: Vitest for all admin services (query logic, status transitions, CSV parsing, analytics aggregation)
- **Component tests**: Vitest + Testing Library for admin React components
- **E2E tests**: Playwright for critical flows (login -> view orders -> update status, CSV import, product CRUD)
- **Coverage targets**: Unit 95%, Integration 90%, E2E 100% of AC scenarios

---

## Technical Challenges

### Challenge 1: Making Order.userId/addressId Optional
**Solution**: Database migration with `ALTER COLUMN ... DROP NOT NULL`. Update existing customer-facing `OrdersService` to always filter by `userId IS NOT NULL` (no behavior change for customer app). All existing orders already have userId set.
**Risk**: Low. Additive change. Existing queries unaffected because they always pass a userId filter.

### Challenge 2: Large CSV Import (10,000 rows)
**Solution**: Streaming CSV parser (`csv-parse`) with batch inserts (100 per transaction). For files > 5,000 rows, consider a Bull/BullMQ background job with progress tracking.
**Risk**: Medium. Mitigated by streaming and batching. Timeout set to 5 minutes for large files.

### Challenge 3: Analytics Query Performance
**Solution**: Add database indexes on `orders(channel, created_at, status)`. Use `DATE_TRUNC` via raw SQL for time-series. Queries filter by date range to bound dataset size.
**Risk**: Low at current scale. If order volume grows past 100K, add materialized views.

### Challenge 4: Image Upload Storage
**Solution**: Abstract behind a `StorageAdapter` interface. Implement `LocalStorageAdapter` for development. Future increment adds `S3StorageAdapter` or `R2StorageAdapter`.
**Risk**: Low. Interface boundary ensures no code changes needed when migrating storage backends.

### Challenge 5: JWT Role Staleness
**Solution**: Access tokens are short-lived (15 minutes). Admin role changes are rare operational events. If immediate revocation is needed, add a token blacklist in a future increment.
**Risk**: Low. Acceptable for this increment's scope.

---

## Domain Skill Recommendations

For implementation, chain the following domain skills:
- **backend:nestjs** -- Admin NestJS modules, guards, services, controllers, DTOs
- **frontend:nextjs** -- Admin Next.js 15 app pages, components, data fetching, middleware
