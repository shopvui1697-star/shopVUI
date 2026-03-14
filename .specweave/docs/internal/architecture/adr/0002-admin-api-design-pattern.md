# ADR-0002: Admin API Design Pattern

## Status
Accepted

## Date
2026-03-11

## Context
The admin dashboard needs API endpoints for order management, product CRUD, coupon management, reseller oversight, customer listing, analytics, and CSV import. These endpoints overlap with existing customer-facing endpoints but have different authorization, filtering, and data shapes.

## Decision

### Separate Admin Modules in NestJS
Create admin-specific modules under `apps/api/src/admin/` with the prefix `/admin/*`:

- `admin/orders/` - Full order list (all users, all channels), status updates, bulk actions
- `admin/products/` - Product CRUD with image upload
- `admin/coupons/` - Coupon CRUD, reseller coupon approval
- `admin/resellers/` - Reseller management, commission, payouts
- `admin/customers/` - Customer listing with aggregated stats
- `admin/analytics/` - Aggregation queries for charts
- `admin/imports/` - CSV upload and processing

### Why Not Extend Existing Modules
Existing modules (e.g., `OrdersService`) are scoped to a single user (`userId` filtering). Admin needs cross-user queries with different filtering, pagination, and includes. Mixing these concerns would bloat existing services and make authorization error-prone.

### AdminModule as Umbrella
A top-level `AdminModule` imports all admin sub-modules and applies the `AdminGuard` at the module level via `APP_GUARD` scoping or controller-level `@UseGuards(AdminGuard)`.

### Reusing Prisma Queries
Admin services import `prisma` from `@shopvui/db` directly (same pattern as existing services). Where logic overlaps (e.g., order number generation), it is extracted to shared utility functions rather than cross-importing services.

## Consequences
- Clear separation between customer and admin API surfaces
- Admin endpoints are all under `/admin/*` prefix
- AdminGuard applied consistently to all admin routes
- No risk of accidentally exposing admin queries to customers
