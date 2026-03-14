---
increment: 0007-feature-enhancements
title: 'Feature Enhancements: Closing Remaining Gaps'
status: completed
priority: P1
type: feature
created: 2026-03-12T00:00:00.000Z
---

# Feature Enhancements: Closing Remaining Gaps

## Problem Statement

ShopVui has approximately 90% of its core functionality built across increments 0001-0006. However, six feature gaps remain that affect customer experience (wishlist), admin efficiency (price tier management, print invoices), business intelligence (AOV analytics, reseller performance analytics), and reseller growth (shareable coupon links). Closing these gaps completes the product for launch readiness.

## Goals

- Enable customers to save and manage wishlists for improved engagement and return visits
- Give admins a UI to manage quantity-based price tiers without database access
- Provide average order value analytics broken down by sales channel
- Surface reseller performance metrics for program optimization
- Enable resellers to generate shareable coupon links for easier customer acquisition
- Allow bulk invoice printing for order fulfillment workflow

## User Stories

### US-001: Customer Wishlist
**Project**: shopvui
**As a** logged-in customer
**I want** to save products to a wishlist and manage them from my account
**So that** I can bookmark products I am interested in and return to purchase them later

**Acceptance Criteria**:
- [x] **AC-US1-01**: Given a logged-in customer viewing a product page, when they click "Add to Wishlist", then the product is saved to their wishlist and the button reflects the saved state
- [x] **AC-US1-02**: Given a customer with wishlist items, when they navigate to their account wishlist page, then all saved products are displayed with name, image, price, and stock status
- [x] **AC-US1-03**: Given a customer viewing their wishlist, when they click "Remove" on an item, then the product is removed from the wishlist immediately
- [x] **AC-US1-04**: Given a customer who logs out and logs back in, when they view their wishlist, then all previously saved items persist
- [x] **AC-US1-05**: Given an unauthenticated visitor, when they click "Add to Wishlist", then they are redirected to login with a return URL back to the product page

---

### US-002: Admin Price Tier Management UI
**Project**: shopvui
**As an** admin
**I want** to create, edit, and delete quantity-based price tiers for each product from the product edit page
**So that** I can manage volume discounts without direct database access

**Acceptance Criteria**:
- [x] **AC-US2-01**: Given the admin product edit page, when the admin views the price tiers section, then existing price tiers for that product are listed showing min_qty, max_qty (or "unlimited"), and price in VND
- [x] **AC-US2-02**: Given the price tiers section, when the admin adds a new tier with min_qty, max_qty (optional), and price, then the tier is created and the list updates
- [x] **AC-US2-03**: Given an existing price tier, when the admin edits its values and saves, then the tier is updated in the database
- [x] **AC-US2-04**: Given an existing price tier, when the admin deletes it, then the tier is removed and remaining tiers are displayed
- [x] **AC-US2-05**: Given overlapping quantity ranges (e.g., 1-10 and 5-15), when the admin attempts to save, then a validation error is shown preventing the overlap

---

### US-003: Average Order Value Analytics
**Project**: shopvui
**As an** admin
**I want** to view average order value broken down by sales channel with configurable time periods
**So that** I can identify which channels drive higher-value orders and optimize accordingly

**Acceptance Criteria**:
- [x] **AC-US3-01**: Given the admin analytics page, when the admin views the AOV section, then a chart displays average order value per channel (website, shopee, tiktok, facebook, other)
- [x] **AC-US3-02**: Given the AOV chart, when the admin selects daily, weekly, or monthly time period, then the chart data recalculates for the selected granularity
- [x] **AC-US3-03**: Given the AOV chart, when the admin selects a date range, then only orders within that range are included in the calculation
- [x] **AC-US3-04**: Given the AOV section, when data loads, then the overall AOV across all channels is displayed as a summary metric alongside the per-channel breakdown

---

### US-004: Reseller Performance Analytics
**Project**: shopvui
**As an** admin
**I want** to view reseller performance metrics including revenue, commissions, and conversion rates
**So that** I can evaluate and optimize the reseller program

**Acceptance Criteria**:
- [x] **AC-US4-01**: Given the admin analytics page, when the admin navigates to the reseller performance section, then a table shows each active reseller with total revenue generated, commission cost, and order count
- [x] **AC-US4-02**: Given the reseller performance section, when data loads, then top-performing resellers are ranked by revenue with a visual indicator (chart or ranked list)
- [x] **AC-US4-03**: Given the reseller performance section, when the admin views conversion rates, then the ratio of orders attributed to reseller coupons vs total orders is displayed for a selected time period
- [x] **AC-US4-04**: Given the reseller performance section, when the admin selects a date range, then all metrics recalculate for the selected period
- [x] **AC-US4-05**: Given the reseller performance section, when the admin views summary metrics, then total commission paid, total reseller-driven revenue, and average commission rate are displayed

---

### US-005: Shareable Coupon Links for Resellers
**Project**: shopvui
**As a** reseller
**I want** to generate shareable links that pre-apply my coupon code
**So that** I can share them on social media and customers automatically get my discount at checkout

**Acceptance Criteria**:
- [x] **AC-US5-01**: Given the reseller portal, when a reseller views their active coupons, then each coupon shows a "Copy Link" button that copies a URL in the format `{site}?coupon={CODE}` to the clipboard
- [x] **AC-US5-02**: Given a customer visiting the site via a URL with `?coupon=CODE` query parameter, when they add items to cart and reach checkout, then the coupon code is pre-filled in the coupon input field
- [x] **AC-US5-03**: Given a pre-applied coupon from a URL parameter, when the coupon is valid, then the discount is reflected in the order summary automatically
- [x] **AC-US5-04**: Given a pre-applied coupon from a URL parameter, when the coupon is invalid or expired, then a message informs the customer and checkout proceeds without the discount
- [x] **AC-US5-05**: Given the reseller portal shareable link section, when the reseller views their links, then click count or usage count for each link is displayed if tracking data is available

---

### US-006: Bulk Print Invoices
**Project**: shopvui
**As an** admin
**I want** to select multiple orders and print their invoices in bulk
**So that** I can efficiently prepare invoices for shipment without opening each order individually

**Acceptance Criteria**:
- [x] **AC-US6-01**: Given the admin order list with bulk actions, when the admin selects orders and chooses "Print Invoices", then a printable page opens with invoices for all selected orders
- [x] **AC-US6-02**: Given a generated invoice, when rendered, then it includes order number, order date, customer name, phone, email, shipping address, line items with quantity and unit price, subtotal, discount amount, coupon code (if applied), shipping fee, and total
- [x] **AC-US6-03**: Given multiple invoices generated, when the admin triggers print (browser print dialog), then each invoice starts on a new page with proper page-break styling
- [x] **AC-US6-04**: Given the bulk print action, when more than 50 orders are selected, then a warning is shown suggesting the admin reduce the selection for performance reasons
- [x] **AC-US6-05**: Given the invoice layout, when printed on A4 paper, then the layout fits cleanly without content overflow or clipping

## Out of Scope

- Wishlist sharing with other users or social media
- Wishlist "back in stock" notifications
- Price tier scheduling (future effective dates)
- Real-time analytics / WebSocket dashboard updates
- PDF generation for invoices (HTML print-to-PDF via browser is sufficient)
- Reseller link shortener or custom vanity URLs
- Advanced reseller analytics (cohort analysis, LTV projections)

## Technical Notes

### Dependencies
- Increments 0001-0006: All existing models, services, and admin/web apps
- Prisma schema: PriceTier model exists; Wishlist model needs to be added
- Existing admin analytics service: `apps/api/src/admin/analytics/admin-analytics.service.ts`
- Existing bulk actions: `apps/api/src/admin/orders/admin-orders.service.ts` (mark_shipped, export_csv)
- Reseller portal: existing routes in `apps/web/`

### Constraints
- Wishlist requires authenticated user (no anonymous wishlist)
- Price tiers use VND (integer, no decimals) matching existing price fields
- AOV and reseller analytics queries must use server-side aggregation to avoid loading full order datasets to the client
- Invoice HTML must use CSS `@media print` and `page-break-before` for clean multi-page printing
- Coupon URL parameter (`?coupon=CODE`) must persist through navigation until checkout or explicit removal

### Architecture Decisions
- Wishlist: New Prisma model with userId + productId unique constraint; REST endpoints under customer auth
- Price tier UI: Inline editable table component on the existing product edit page; reuses existing PriceTier CRUD API
- Analytics: Extend existing admin-analytics.service.ts with new aggregation queries; new chart components in `apps/admin/src/app/admin/analytics/`
- Shareable links: No backend changes needed for link generation (client-side URL construction); customer-facing site reads query param via Next.js middleware or client hook
- Invoice printing: Server-side HTML template rendered by API; admin frontend opens in new tab for printing

## Success Metrics

- Wishlist: Customers can add/remove/view wishlist items with sub-500ms response times
- Price tiers: Admin can manage tiers without errors; validation prevents overlapping ranges
- AOV analytics: Chart renders accurate data matching manual calculation within 2% margin
- Reseller analytics: All metrics match underlying Commission and Order data
- Shareable links: Coupon auto-applies successfully when visiting via shared link
- Invoices: Bulk print handles 50 orders cleanly with proper page breaks on A4
