---
increment: 0006-admin-dashboard
title: Unified Admin Dashboard
status: completed
priority: P0
type: feature
created: 2026-03-11T00:00:00.000Z
---

# Unified Admin Dashboard

## Problem Statement

ShopVui sells across multiple channels (website, Shopee, TikTok Shop, Facebook, others) but has no centralized admin interface. Admins cannot view orders, manage products, handle coupons, oversee resellers, or analyze performance from a single place. This forces manual cross-platform checking, delays order fulfillment, and prevents data-driven decisions.

## Goals

- Provide a unified order management view across all sales channels
- Enable CRUD operations for products, coupons, and customers
- Give admins visibility into reseller performance and commission management
- Deliver channel-level analytics and reporting dashboards
- Establish role-based admin authentication (admin role on User model)

## User Stories

### US-001: Admin Authentication and Role-Based Access
**Project**: shopvui
**As an** admin
**I want** to log in to the admin dashboard with role-based access control
**So that** only authorized personnel can manage the store

**Acceptance Criteria**:
- [x] **AC-US1-01**: Given a User with role "admin", when they navigate to /admin and authenticate, then they see the admin dashboard home
- [x] **AC-US1-02**: Given a User with role "customer" or "reseller", when they attempt to access /admin, then they are denied access with a 403 response
- [x] **AC-US1-03**: Given an unauthenticated visitor, when they navigate to /admin, then they are redirected to the admin login page
- [x] **AC-US1-04**: Given the User model, when the migration runs, then a "role" field exists with enum values (customer, admin, reseller) defaulting to "customer"

---

### US-002: Unified Order List with Channel Filtering
**Project**: shopvui
**As an** admin
**I want** to see all orders from all channels in a single list with filtering
**So that** I can manage fulfillment without switching between platforms

**Acceptance Criteria**:
- [x] **AC-US2-01**: Given orders exist from multiple channels, when the admin views the order list, then all orders appear sorted by creation date (newest first)
- [x] **AC-US2-02**: Given the order list, when the admin filters by channel (website, shopee, tiktok, facebook, other), then only orders from that channel are shown
- [x] **AC-US2-03**: Given the order list, when the admin filters by status, date range, or payment status, then results update accordingly
- [x] **AC-US2-04**: Given the order list, when the admin searches by order ID, customer name, or phone, then matching orders are returned
- [x] **AC-US2-05**: Given the order list, when the admin selects bulk actions, then they can mark shipped, export CSV, or print invoices for selected orders

---

### US-003: Order Detail and Status Management
**Project**: shopvui
**As an** admin
**I want** to view full order details and update order status
**So that** I can track and fulfill orders accurately

**Acceptance Criteria**:
- [x] **AC-US3-01**: Given an order, when the admin clicks it, then they see customer info, line items, pricing breakdown, applied coupon, and reseller attribution
- [x] **AC-US3-02**: Given an order in "pending" status, when the admin updates status to "confirmed", then the status changes and an OrderStatusHistory record is created
- [x] **AC-US3-03**: Given valid status transitions (pending->confirmed->shipping->delivered, or pending->cancelled, shipping->returned), when the admin selects a new status, then only valid next statuses are available
- [x] **AC-US3-04**: Given an order from an external channel (Shopee/TikTok), when displayed, then the external order ID and channel source are visible

---

### US-004: External Channel Order Import
**Project**: shopvui
**As an** admin
**I want** to import orders from external channels via CSV upload
**So that** I can consolidate all sales data without waiting for API integrations

**Acceptance Criteria**:
- [x] **AC-US4-01**: Given a CSV file with order data, when the admin uploads it with a channel selection (shopee, tiktok, facebook, other), then orders are created in the database with the correct channel value
- [x] **AC-US4-02**: Given a CSV upload, when the file contains invalid rows, then a summary report shows which rows failed and why, while valid rows are imported
- [x] **AC-US4-03**: Given future API sync needs, when the import module is built, then stub service interfaces exist for Shopee Open Platform API and TikTok Shop Seller API
- [x] **AC-US4-04**: Given a duplicate external order ID for the same channel, when importing, then the duplicate is skipped and reported

---

### US-005: Product Management
**Project**: shopvui
**As an** admin
**I want** to add, edit, and delete products with images, categories, and price tiers
**So that** I can maintain the product catalog from the dashboard

**Acceptance Criteria**:
- [x] **AC-US5-01**: Given the product management page, when the admin creates a product, then they can set name, description, base price, category, stock quantity, and upload images
- [x] **AC-US5-02**: Given an existing product, when the admin edits it, then all fields including images and price tiers are updatable
- [x] **AC-US5-03**: Given a product, when the admin deletes it, then it is soft-deleted and no longer visible on the storefront
- [x] **AC-US5-04**: Given the product list, when the admin views it, then products are filterable by category and searchable by name

---

### US-006: Coupon Management
**Project**: shopvui
**As an** admin
**I want** to create, manage, and analyze coupons including reseller coupon requests
**So that** I can control promotions and oversee reseller discount activity

**Acceptance Criteria**:
- [x] **AC-US6-01**: Given the coupon management page, when the admin creates a coupon, then they can set code, discount type (percentage/fixed), value, min order, max uses, expiry, and applicable categories
- [x] **AC-US6-02**: Given reseller coupon requests exist, when the admin views them, then they can approve or reject each request
- [x] **AC-US6-03**: Given a coupon, when the admin toggles active/inactive, then the coupon's availability updates immediately
- [x] **AC-US6-04**: Given the coupon list, when the admin views usage statistics, then times used, total discount given, and associated revenue are displayed
- [x] **AC-US6-05**: Given reseller-created coupons, when viewing the coupon list, then reseller attribution and commission cost impact are visible

---

### US-007: Reseller Management and Commission Tracking
**Project**: shopvui
**As an** admin
**I want** to manage resellers, set commission rates, and handle payouts
**So that** I can oversee the reseller program and ensure accurate compensation

**Acceptance Criteria**:
- [x] **AC-US7-01**: Given the reseller list, when the admin views it, then all resellers are shown with status (pending, approved, rejected, suspended), order count, and total revenue
- [x] **AC-US7-02**: Given a pending reseller application, when the admin approves or rejects it, then the reseller status updates and they are notified
- [x] **AC-US7-03**: Given a reseller, when the admin sets a commission rate, then it can be set per-reseller or fall back to a global default rate
- [x] **AC-US7-04**: Given commission records, when the admin views payout management, then they can filter by status (pending, approved, paid) and mark payouts as approved or paid
- [x] **AC-US7-05**: Given the reseller management page, when the admin exports commission reports, then a CSV with reseller name, orders, revenue, commission owed, and payout status is downloaded

---

### US-008: Customer Management
**Project**: shopvui
**As an** admin
**I want** to view and search customers with their purchase history across channels
**So that** I can understand customer behavior and provide support

**Acceptance Criteria**:
- [x] **AC-US8-01**: Given the customer list, when the admin views it, then each customer shows name, email, order count, total spend, and last order date
- [x] **AC-US8-02**: Given a customer, when the admin clicks their profile, then purchase history across all channels is displayed
- [x] **AC-US8-03**: Given the customer list, when the admin searches by name, email, or phone, then matching customers are returned
- [x] **AC-US8-04**: Given the customer list, when the admin applies filters (by total spend range, registration date), then results update accordingly

---

### US-009: Analytics and Reporting Dashboard
**Project**: shopvui
**As an** admin
**I want** to view revenue, order, product, coupon, and reseller analytics
**So that** I can make data-driven business decisions

**Acceptance Criteria**:
- [x] **AC-US9-01**: Given the analytics page, when the admin views revenue by channel, then a pie/bar chart shows revenue breakdown for website, shopee, tiktok, facebook, and other
- [x] **AC-US9-02**: Given the analytics page, when the admin views revenue over time, then a line chart shows daily/weekly/monthly revenue with date range selection
- [x] **AC-US9-03**: Given the analytics page, when the admin views top selling products, then a ranked list with units sold and revenue is displayed
- [x] **AC-US9-04**: Given the analytics page, when the admin views order volume per channel, then a bar chart shows order counts by channel for the selected period
- [x] **AC-US9-05**: Given the analytics page, when the admin views coupon performance, then each coupon shows usage count, total discount given, and orders influenced

## Out of Scope

- Real-time API sync with Shopee/TikTok/Facebook (stubs only; full integration in future increment)
- Inventory sync across channels (website inventory only)
- Push notifications or email alerts for admins
- Multi-admin permission levels (all admins have full access in this increment)
- Mobile-responsive admin layout (desktop-first)
- Real-time WebSocket order updates

## Technical Notes

### Dependencies
- Increment 0001-0004: Existing Prisma models (User, Product, Order, Coupon, etc.)
- Increment 0005-reseller-program: Reseller, Commission models and APIs
- apps/admin: Next.js 15 app (scaffolded, empty)
- NestJS API: All existing modules

### Constraints
- User model needs "role" field migration (customer|admin|reseller enum)
- External channel orders use the existing Order model with `channel` field
- CSV import must handle large files (up to 10,000 rows)
- Analytics queries must use server-side aggregation to avoid loading full datasets to client
- Admin app runs on separate port from customer-facing apps/web

### Architecture Decisions
- Admin auth: JWT-based with role check middleware on NestJS, session-based on Next.js admin app
- Charts: Use a lightweight charting library (e.g., Recharts) in Next.js
- CSV parsing: Server-side with streaming for large files
- API sync stubs: Define interfaces/service classes for Shopee and TikTok APIs without implementation

## Success Metrics

- Admin can view and manage orders from all channels in under 3 seconds page load
- CSV import processes 1,000 orders in under 30 seconds
- All CRUD operations for products, coupons, resellers, and customers functional
- Analytics charts render with accurate aggregated data
- Role-based access prevents unauthorized dashboard access
