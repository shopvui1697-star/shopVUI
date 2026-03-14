---
increment: 0006-admin-dashboard
title: "Unified Admin Dashboard"
generated: 2026-03-11
by_user_story:
  US-001: [T-001, T-002, T-003, T-004]
  US-002: [T-005, T-006, T-007]
  US-003: [T-006, T-007]
  US-004: [T-008, T-009, T-010]
  US-005: [T-011, T-012, T-013]
  US-006: [T-014, T-015]
  US-007: [T-016, T-017, T-018]
  US-008: [T-019, T-020]
  US-009: [T-021, T-022, T-023]
---

# Tasks: Unified Admin Dashboard

## User Story: US-001 - Admin Authentication and Role-Based Access

**Linked ACs**: AC-US1-01, AC-US1-02, AC-US1-03, AC-US1-04
**Tasks**: 4 total, 4 completed

---

### T-001: Prisma Migration -- UserRole Enum and Order External Fields

**User Story**: US-001
**Satisfies ACs**: AC-US1-04
**Status**: [x] completed

**Test Plan**:
- **Given** the existing User model in packages/db/prisma/schema.prisma
- **When** the migration runs
- **Then** a `role` field exists on the User table with enum values CUSTOMER, ADMIN, RESELLER defaulting to CUSTOMER, and Order has externalOrderId/customerName/customerPhone/customerEmail fields with nullable userId and addressId

**Test Cases**:
1. **Integration**: `packages/db/tests/migration.test.ts`
   - testRoleFieldDefaultsToCustomer(): Create a user without role, assert role === 'CUSTOMER'
   - testAdminRoleAssignable(): Create user with role ADMIN, read back, assert ADMIN
   - testExternalOrderFieldsExist(): Create order without userId/addressId, assert succeeds
   - testDuplicateExternalOrderIdSameChannelRejected(): Insert two orders with same externalOrderId+channel, assert constraint error
   - **Coverage Target**: 90%

**Implementation**:
1. Add `UserRole` enum to `packages/db/prisma/schema.prisma` (CUSTOMER, ADMIN, RESELLER)
2. Add `role UserRole @default(CUSTOMER)` to User model
3. Add `externalOrderId String?`, `customerName String?`, `customerPhone String?`, `customerEmail String?` to Order model
4. Make `userId String?` and `addressId String?` nullable on Order model
5. Add `@@index([channel])` and `@@index([externalOrderId, channel])` to Order model
6. Run `pnpm --filter @shopvui/db db:migrate` with name `add_user_role_external_order_fields`
7. Add raw SQL migration file for partial unique index: `CREATE UNIQUE INDEX IF NOT EXISTS order_external_id_channel_unique ON orders(external_order_id, channel) WHERE external_order_id IS NOT NULL`
8. Run tests

---

### T-002: AdminGuard and JWT Role Claim

**User Story**: US-001
**Satisfies ACs**: AC-US1-01, AC-US1-02
**Status**: [x] completed

**Test Plan**:
- **Given** a NestJS route protected with `@UseGuards(JwtAuthGuard, AdminGuard)`
- **When** a request arrives with a JWT where `role === 'ADMIN'`
- **Then** the request is allowed through (canActivate returns true)
- **When** a request arrives with `role === 'CUSTOMER'` or `role === 'RESELLER'`
- **Then** ForbiddenException is thrown (403)
- **When** no user is on the request
- **Then** ForbiddenException is thrown

**Test Cases**:
1. **Unit**: `apps/api/src/admin/guards/admin.guard.spec.ts`
   - testAdminRoleAllowed(): Mock ExecutionContext with user.role=ADMIN, expect canActivate()=true
   - testCustomerRoleDenied(): Mock with user.role=CUSTOMER, expect ForbiddenException
   - testResellerRoleDenied(): Mock with user.role=RESELLER, expect ForbiddenException
   - testNoUserDenied(): Mock with no user on request, expect ForbiddenException
   - **Coverage Target**: 95%

2. **Unit**: `apps/api/src/auth/jwt.strategy.spec.ts`
   - testJwtPayloadIncludesRole(): validate() returns object with role field from DB user
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/api/src/admin/guards/admin.guard.ts` implementing `CanActivate`
2. Update `JwtStrategy.validate()` to query User.role and include it in returned payload
3. Update `AuthUser` interface in `packages/shared/src/auth.ts` to add `role: 'CUSTOMER' | 'ADMIN' | 'RESELLER'`
4. Create `apps/api/src/admin/admin.module.ts` as umbrella module registering all admin sub-modules
5. Register `AdminGuard` as a provider in `AdminModule`
6. Register `AdminModule` in `AppModule`
7. Run tests

---

### T-003: Admin App Middleware and Login Flow (Next.js 15)

**User Story**: US-001
**Satisfies ACs**: AC-US1-01, AC-US1-02, AC-US1-03
**Status**: [x] completed

**Test Plan**:
- **Given** an unauthenticated visitor navigating to `/admin/orders`
- **When** the Next.js middleware runs
- **Then** they are redirected to `/login`
- **Given** a valid JWT cookie with role=CUSTOMER
- **When** the middleware checks the role
- **Then** a 403 response is returned
- **Given** a valid JWT cookie with role=ADMIN
- **When** the middleware runs
- **Then** NextResponse.next() is returned (request proceeds)

**Test Cases**:
1. **Unit**: `apps/admin/src/middleware.test.ts`
   - testNoTokenRedirectsToLogin(): No JWT cookie, expect redirect to /login
   - testCustomerRoleReturns403(): JWT with role=CUSTOMER, expect 403 response
   - testAdminRoleAllowed(): JWT with role=ADMIN, expect NextResponse.next()
   - testPublicLoginRouteBypassesMiddleware(): Request to /login, expect no redirect
   - **Coverage Target**: 95%

2. **E2E**: `apps/admin/e2e/auth.spec.ts`
   - testUnauthenticatedRedirectsToLogin(): Navigate to /admin/orders, assert URL becomes /login
   - testNonAdminSeesAccessDenied(): Login as customer role user, assert 403 page visible
   - **Coverage Target**: 100% of AC scenarios

**Implementation**:
1. Create `apps/admin/src/middleware.ts` with JWT cookie check and role validation using jose or jsonwebtoken
2. Create `apps/admin/src/app/login/page.tsx` with Google OAuth trigger button
3. Create `apps/admin/src/lib/auth.ts` (login, logout, getSession utilities)
4. Create `apps/admin/src/lib/api.ts` (fetch wrapper reading JWT from cookie and adding Authorization header)
5. Create `apps/admin/src/app/layout.tsx` root layout
6. Create `apps/admin/src/app/(dashboard)/layout.tsx` with sidebar + header shell
7. Run unit tests then E2E tests

---

### T-004: Admin Core UI Components and Shared Types

**User Story**: US-001
**Satisfies ACs**: AC-US1-01
**Status**: [x] completed

**Test Plan**:
- **Given** the admin dashboard layout renders with an ADMIN user
- **When** the sidebar renders
- **Then** it shows links: Orders, Products, Coupons, Resellers, Customers, Analytics, Imports
- **When** the header renders
- **Then** it shows the user's name and a logout button that calls logout()

**Test Cases**:
1. **Unit**: `apps/admin/src/components/sidebar.test.tsx`
   - testSidebarRendersAllSevenNavLinks(): Assert 7 nav links present
   - testActiveRouteHighlighted(): Mock usePathname as /admin/orders, assert Orders link has active class
   - **Coverage Target**: 85%

2. **Unit**: `apps/admin/src/components/header.test.tsx`
   - testHeaderShowsUserName(): Render with user prop, assert name in DOM
   - testLogoutButtonCallsLogout(): Click logout, assert auth.logout() invoked
   - **Coverage Target**: 85%

**Implementation**:
1. Add admin types to `packages/shared/src/admin.ts`:
   - AdminOrderListItem, AdminOrderDetail, AdminOrderFilters
   - AdminProductForm, AdminProductListItem
   - AdminCouponListItem, AdminCouponForm
   - AdminResellerListItem, AdminPayoutListItem
   - AdminCustomerListItem, AdminCustomerDetail
   - AnalyticsRevenueByChannel, AnalyticsRevenueOverTime, AnalyticsTopProducts, AnalyticsCouponPerformance
   - CsvImportResult, OrderStatusTransition
2. Create `apps/admin/src/lib/constants.ts` (status labels, channel names, color maps)
3. Create `apps/admin/src/components/sidebar.tsx`
4. Create `apps/admin/src/components/header.tsx`
5. Create `apps/admin/src/components/data-table.tsx` (reusable sortable, filterable, paginated table)
6. Create `apps/admin/src/components/status-badge.tsx`
7. Create `apps/admin/src/components/pagination.tsx`
8. Run unit tests

---

## User Story: US-002 - Unified Order List with Channel Filtering

**Linked ACs**: AC-US2-01, AC-US2-02, AC-US2-03, AC-US2-04, AC-US2-05
**Tasks**: 3 total, 3 completed

---

### T-005: Admin Orders API -- List, Filter, Search

**User Story**: US-002
**Satisfies ACs**: AC-US2-01, AC-US2-02, AC-US2-03, AC-US2-04
**Status**: [x] completed

**Test Plan**:
- **Given** orders from multiple channels exist in the database
- **When** GET `/admin/orders` is called with no filters
- **Then** all orders are returned sorted by createdAt descending, paginated
- **When** called with `?channel=shopee`
- **Then** only Shopee orders are returned
- **When** called with `?status=PENDING&dateFrom=2026-01-01&dateTo=2026-01-31&paymentStatus=PAID`
- **Then** only orders matching all three filters are returned
- **When** called with `?search=CUST001`
- **Then** orders matching that order ID, customer name, or phone are returned

**Test Cases**:
1. **Unit**: `apps/api/src/admin/orders/admin-orders.service.spec.ts`
   - testListOrdersDefaultSortByCreatedAtDesc(): Verify Prisma query includes orderBy createdAt desc
   - testFilterByChannel(): Verify where clause includes channel filter
   - testFilterByStatus(): Verify status filter applied to where clause
   - testFilterByDateRange(): Verify createdAt gte/lte filter applied
   - testSearchByOrderId(): Verify OR clause for id, customerName, customerPhone
   - testPaginationSkipTakeCalculated(): page=2, limit=20, expect skip=20 take=20
   - **Coverage Target**: 95%

2. **Integration**: `apps/api/src/admin/orders/admin-orders.controller.spec.ts`
   - testGetOrdersReturns200ForAdmin(): Authenticated ADMIN, expect 200
   - testGetOrdersReturns403ForCustomer(): Authenticated CUSTOMER, expect 403
   - testGetOrdersReturns401Unauthenticated(): No JWT, expect 401
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/api/src/admin/orders/dto/admin-order-filters.dto.ts` with channel, status, dateFrom, dateTo, paymentStatus, search, page, limit
2. Create `apps/api/src/admin/orders/admin-orders.service.ts` with `findAll(filters: AdminOrderFiltersDto)` method
3. Create `apps/api/src/admin/orders/admin-orders.controller.ts` with `GET /admin/orders` using `@UseGuards(JwtAuthGuard, AdminGuard)`
4. Create `apps/api/src/admin/orders/admin-orders.module.ts`
5. Import `AdminOrdersModule` in `AdminModule`
6. Run tests

---

### T-006: Admin Orders API -- Bulk Actions and Order Detail

**User Story**: US-002, US-003
**Satisfies ACs**: AC-US2-05, AC-US3-01, AC-US3-02, AC-US3-03, AC-US3-04
**Status**: [x] completed

**Test Plan**:
- **Given** an admin selects orderIds and calls POST `/admin/orders/bulk` with action=mark_shipped
- **When** the bulk action runs
- **Then** all valid orders transition to SHIPPING status and OrderStatusHistory records are created
- **Given** GET `/admin/orders/:id`
- **When** called with a valid order ID
- **Then** response includes customer info, line items, pricing, coupon, reseller attribution, externalOrderId, and channel
- **Given** PATCH `/admin/orders/:id/status` with status=CONFIRMED on a PENDING order
- **Then** status transitions and history is recorded
- **Given** PATCH with status=DELIVERED on a CONFIRMED order (invalid skip)
- **Then** 400 Bad Request is returned

**Test Cases**:
1. **Unit**: `apps/api/src/admin/orders/admin-orders.service.spec.ts`
   - testBulkMarkShipped(): 3 orders, expect 3 status updates and 3 history records
   - testBulkExportCsvReturnsString(): 3 order IDs, expect CSV string with correct headers
   - testGetOrderDetailIncludesAllIncludes(): Assert items, coupon, reseller attribution present
   - testValidTransitionPendingToConfirmed(): Expect update + history created in transaction
   - testValidTransitionConfirmedToShipping(): Same pattern
   - testValidTransitionShippingToDelivered(): Same pattern
   - testValidTransitionPendingToCancelled(): Same pattern
   - testValidTransitionShippingToReturned(): Same pattern
   - testInvalidTransitionConfirmedToDelivered(): Expect BadRequestException
   - testInvalidTransitionDeliveredToAny(): Expect BadRequestException
   - **Coverage Target**: 95%

2. **Integration**: `apps/api/src/admin/orders/admin-orders.controller.spec.ts`
   - testGetOrderDetailReturns404Unknown(): Non-existent ID, expect 404
   - testPatchStatusReturns400InvalidTransition(): CONFIRMED to DELIVERED, expect 400
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/api/src/admin/orders/dto/update-order-status.dto.ts`
2. Create `apps/api/src/admin/orders/dto/bulk-action.dto.ts`
3. Add `findOne(id)` to service with full Prisma includes (items, user, coupon, reseller)
4. Add status transition constants: `VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]>`
5. Add `updateStatus(id, dto)` method validating transition and creating history record in a transaction
6. Add `bulkAction(dto)` method handling mark_shipped, export_csv actions
7. Add `GET /admin/orders/:id`, `PATCH /admin/orders/:id/status`, `POST /admin/orders/bulk` endpoints
8. Check if `OrderStatusHistory` model exists; add to schema if missing and run migration
9. Run tests

---

### T-007: Admin Orders UI

**User Story**: US-002, US-003
**Satisfies ACs**: AC-US2-01, AC-US2-02, AC-US2-03, AC-US2-04, AC-US2-05, AC-US3-01, AC-US3-02, AC-US3-03, AC-US3-04
**Status**: [x] completed

**Test Plan**:
- **Given** the admin is on the orders page
- **When** the page loads
- **Then** order list renders with columns: order ID, customer, channel badge, status badge, date, total
- **When** the admin selects a channel filter
- **Then** URL search params update and filtered orders render
- **When** the admin checks multiple rows and clicks "Mark Shipped"
- **Then** bulk action API is called and rows refresh
- **Given** the admin clicks an order row
- **When** the detail page loads
- **Then** customer info, line items, coupon section, reseller attribution, and status update controls are visible
- **When** the status dropdown opens
- **Then** only valid next statuses are available as options

**Test Cases**:
1. **Unit**: `apps/admin/src/app/(dashboard)/orders/page.test.tsx`
   - testOrderListRendersAllColumns(): Mock API response, assert all column headers present
   - testChannelFilterUpdatesSearchParam(): Select Shopee, assert ?channel=shopee in URL
   - testBulkSelectRevealsBulkActionBar(): Check 2 rows, assert action bar appears
   - **Coverage Target**: 85%

2. **Unit**: `apps/admin/src/app/(dashboard)/orders/[id]/page.test.tsx`
   - testOrderDetailRendersAllSections(): Assert customer/items/coupon/reseller sections
   - testStatusDropdownShowsOnlyValidTransitions(): PENDING order, assert only CONFIRMED/CANCELLED in dropdown
   - testExternalChannelBadgeVisible(): External shopee order, assert Shopee badge and externalOrderId shown
   - **Coverage Target**: 85%

3. **E2E**: `apps/admin/e2e/orders.spec.ts`
   - testOrderListLoads(): Navigate to /admin/orders, assert table with data visible
   - testChannelFilterWorks(): Select TikTok filter, assert only tiktok orders shown
   - testOrderStatusUpdate(): Click order, update status to CONFIRMED, assert status badge changes
   - **Coverage Target**: 100% of AC scenarios

**Implementation**:
1. Create `apps/admin/src/app/(dashboard)/orders/page.tsx` as Server Component
2. Create `apps/admin/src/components/orders/order-filters.tsx` (channel, status, date range, search)
3. Create `apps/admin/src/components/orders/orders-table.tsx` with bulk select and DataTable
4. Create `apps/admin/src/app/(dashboard)/orders/[id]/page.tsx`
5. Create `apps/admin/src/components/orders/order-detail.tsx`
6. Create `apps/admin/src/components/orders/status-update-dialog.tsx` (valid-transitions-only dropdown)
7. Run unit tests, then E2E tests

---

## User Story: US-004 - External Channel Order Import

**Linked ACs**: AC-US4-01, AC-US4-02, AC-US4-03, AC-US4-04
**Tasks**: 3 total, 3 completed

---

### T-008: CSV Import API -- Streaming Parser and Deduplication

**User Story**: US-004
**Satisfies ACs**: AC-US4-01, AC-US4-02, AC-US4-04
**Status**: [x] completed

**Test Plan**:
- **Given** a valid CSV file with 500 rows and channel=shopee
- **When** POST `/admin/imports/orders` is called with multipart form data
- **Then** all valid rows are imported and response is `{ imported: 500, skipped: 0, errors: [] }`
- **Given** a CSV with rows missing required fields (e.g., customerName)
- **When** the import runs
- **Then** valid rows import and errors array lists `{ row: N, reason: 'Missing customerName' }`
- **Given** a CSV containing an externalOrderId already imported for the same channel
- **When** re-imported
- **Then** the duplicate is skipped and `skipped` count increments

**Test Cases**:
1. **Unit**: `apps/api/src/admin/imports/admin-imports.service.spec.ts`
   - testValidCsvImportsAllRows(): 300 rows, mock prisma.order.createMany, assert called in batches of 100
   - testInvalidRowsCollectedInErrors(): Row with missing customerName, assert errors array populated
   - testDuplicateExternalIdSkipped(): Mock existing externalOrderId check returns match, assert skipped++
   - testBatchSizeIs100(): 250 rows, assert 3 batch insertions (100+100+50)
   - testResponseShapeCorrect(): Assert response has imported, skipped, errors fields
   - **Coverage Target**: 95%

2. **Integration**: `apps/api/src/admin/imports/admin-imports.controller.spec.ts`
   - testUploadCsvReturns201WithSummary(): Valid multipart file + channel, expect 201 with summary
   - testMissingChannelReturns400(): No channel param, expect 400
   - testNonCsvFileReturns400(): Upload .txt file, expect 400
   - **Coverage Target**: 90%

**Implementation**:
1. Add `csv-parse` to `apps/api` package.json
2. Create `apps/api/src/admin/imports/admin-imports.service.ts` with streaming CSV parse using `csv-parse/stream`
3. Create `apps/api/src/admin/imports/admin-imports.controller.ts` with `@UseInterceptors(FileInterceptor('file'))` and Multer
4. Create `apps/api/src/admin/imports/admin-imports.module.ts`
5. Import `AdminImportsModule` in `AdminModule`
6. Run tests

---

### T-009: Channel API Stubs (Shopee and TikTok)

**User Story**: US-004
**Satisfies ACs**: AC-US4-03
**Status**: [x] completed

**Test Plan**:
- **Given** the channel stubs are compiled
- **When** `ShopeeApiStub.fetchOrders()` is called
- **Then** a `NotImplementedException` is thrown (stub behavior)
- **Given** both stubs
- **Then** both satisfy the `IChannelApiAdapter` interface (TypeScript compilation enforces this)

**Test Cases**:
1. **Unit**: `apps/api/src/admin/imports/channel-stubs/shopee-api.stub.spec.ts`
   - testShopeeStubFetchOrdersThrowsNotImplemented(): Call fetchOrders(), expect NotImplementedException
   - testTiktokStubFetchOrdersThrowsNotImplemented(): Same for TikTok stub
   - **Coverage Target**: 85%

**Implementation**:
1. Create `apps/api/src/admin/imports/channel-stubs/channel-api.interface.ts` with `IChannelApiAdapter` interface (fetchOrders, fetchOrderDetail, getOrderStatus methods)
2. Create `apps/api/src/admin/imports/channel-stubs/shopee-api.stub.ts` implementing interface, each method throws `new NotImplementedException('Shopee API sync not yet implemented')`
3. Create `apps/api/src/admin/imports/channel-stubs/tiktok-api.stub.ts` same pattern
4. Run tests

---

### T-010: CSV Import UI

**User Story**: US-004
**Satisfies ACs**: AC-US4-01, AC-US4-02, AC-US4-04
**Status**: [x] completed

**Test Plan**:
- **Given** the admin is on the imports page
- **When** they select a CSV file, choose channel=shopee, and click Import
- **Then** a loading indicator shows while the upload is in progress
- **When** import completes successfully
- **Then** a summary displays "500 orders imported, 0 skipped, 0 errors"
- **When** there are validation errors
- **Then** a table lists each failed row number and reason

**Test Cases**:
1. **Unit**: `apps/admin/src/app/(dashboard)/imports/page.test.tsx`
   - testFilePickerAndChannelSelectRender(): Assert file input and channel dropdown present
   - testImportButtonCallsApi(): Select file + channel, click Import, assert POST to /admin/imports/orders
   - testSuccessSummaryRendered(): Mock successful response, assert summary card with counts shown
   - testErrorTableRendered(): Mock response with 3 errors, assert error table with 3 rows
   - **Coverage Target**: 85%

**Implementation**:
1. Create `apps/admin/src/components/file-upload.tsx` (drag-drop + click, validates .csv extension)
2. Create `apps/admin/src/app/(dashboard)/imports/page.tsx` with file upload form and channel selector
3. Create `apps/admin/src/components/imports/import-result.tsx` (summary card + error table)
4. Run tests

---

## User Story: US-005 - Product Management

**Linked ACs**: AC-US5-01, AC-US5-02, AC-US5-03, AC-US5-04
**Tasks**: 3 total, 3 completed

---

### T-011: Admin Products API -- CRUD and Image Upload

**User Story**: US-005
**Satisfies ACs**: AC-US5-01, AC-US5-02, AC-US5-03, AC-US5-04
**Status**: [x] completed

**Test Plan**:
- **Given** a valid CreateProductDto with name, description, basePrice, category, stockQuantity
- **When** POST `/admin/products` is called
- **Then** a product is created and 201 returned
- **Given** an existing product ID
- **When** DELETE `/admin/products/:id` is called
- **Then** `product.isActive` is set to false (soft delete), not prisma.product.delete
- **Given** GET `/admin/products?category=electronics&search=phone`
- **Then** only active products in that category with "phone" in name are returned

**Test Cases**:
1. **Unit**: `apps/api/src/admin/products/admin-products.service.spec.ts`
   - testCreateProductSavesAllFields(): Assert prisma.product.create called with all DTO fields
   - testSoftDeleteSetsIsActiveFalse(): Assert prisma.product.update called with isActive=false
   - testFilterByCategoryAndSearchName(): Assert where clause includes category and name contains search
   - testUpdateProductAllUpdatableFields(): Assert all fields passed to prisma.product.update
   - testImageUploadSavesToStorageAdapter(): Mock IStorageAdapter.save, assert URL stored in ProductImage
   - **Coverage Target**: 95%

2. **Integration**: `apps/api/src/admin/products/admin-products.controller.spec.ts`
   - testCreateProductReturns201(): Valid DTO, expect 201
   - testDeleteProductReturns200WithSoftDeleted(): Existing ID, expect 200 with isActive=false product
   - testListProductsReturns200(): Expect 200 with paginated products
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/api/src/admin/products/dto/create-product.dto.ts` and `update-product.dto.ts`
2. Create `apps/api/src/admin/products/storage/storage.interface.ts` (`IStorageAdapter`)
3. Create `apps/api/src/admin/products/storage/local-storage.adapter.ts`
4. Create `apps/api/src/admin/products/admin-products.service.ts`
5. Create `apps/api/src/admin/products/admin-products.controller.ts` with all CRUD endpoints + `POST /admin/products/:id/images` with Multer
6. Create `apps/api/src/admin/products/admin-products.module.ts`
7. Import `AdminProductsModule` in `AdminModule`
8. Run tests

---

### T-012: Admin Products UI -- List, Create, Edit, Delete

**User Story**: US-005
**Satisfies ACs**: AC-US5-01, AC-US5-02, AC-US5-03, AC-US5-04
**Status**: [x] completed

**Test Plan**:
- **Given** the admin is on the products page
- **When** the page loads
- **Then** products are listed with name, category, price, stock quantity, and active status
- **When** the admin clicks New Product and submits a valid form
- **Then** the product is created and appears in the list
- **When** the admin clicks Delete and confirms
- **Then** the product disappears from the list

**Test Cases**:
1. **Unit**: `apps/admin/src/app/(dashboard)/products/page.test.tsx`
   - testProductListRendersColumns(): Assert name/category/price/stock/status columns visible
   - testCategoryAndSearchFiltersUpdateUrl(): Interact with filters, assert URL params set
   - **Coverage Target**: 85%

2. **Unit**: `apps/admin/src/components/products/product-form.test.tsx`
   - testProductFormRendersAllFields(): Assert name, description, basePrice, category, stock, image upload present
   - testFormSubmitCallsPostApi(): Fill form, submit, assert POST /admin/products called
   - testEditFormPopulatesExistingValues(): Pass existing product, assert fields pre-filled
   - **Coverage Target**: 85%

3. **E2E**: `apps/admin/e2e/products.spec.ts`
   - testCreateProduct(): Fill create form, submit, assert product in list
   - testEditProduct(): Click edit on product, change name, save, assert updated name in list
   - testSoftDeleteProduct(): Click delete, confirm dialog, assert product gone from list
   - **Coverage Target**: 100% of AC scenarios

**Implementation**:
1. Create `apps/admin/src/app/(dashboard)/products/page.tsx`
2. Create `apps/admin/src/app/(dashboard)/products/new/page.tsx`
3. Create `apps/admin/src/app/(dashboard)/products/[id]/edit/page.tsx`
4. Create `apps/admin/src/components/products/product-form.tsx` (shared create/edit, includes image upload)
5. Run unit tests, then E2E tests

---

### T-013: StorageAdapter for Image Upload

**User Story**: US-005
**Satisfies ACs**: AC-US5-01, AC-US5-02
**Status**: [x] completed

**Test Plan**:
- **Given** an image file buffer and filename
- **When** `LocalStorageAdapter.save(filename, buffer)` is called
- **Then** the file is written to the configured upload directory and a URL path is returned
- **Given** `LocalStorageAdapter` class
- **Then** it satisfies the `IStorageAdapter` interface (TypeScript compilation check)

**Test Cases**:
1. **Unit**: `apps/api/src/admin/products/storage/local-storage.adapter.spec.ts`
   - testSaveWritesFileAndReturnsUrl(): Mock fs.promises.writeFile, assert returned URL matches `/uploads/{filename}` pattern
   - testInterfaceCompliance(): Instantiate LocalStorageAdapter as IStorageAdapter, no type error
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/api/src/admin/products/storage/storage.interface.ts` with `IStorageAdapter { save(filename: string, buffer: Buffer): Promise<string> }`
2. Create `apps/api/src/admin/products/storage/local-storage.adapter.ts` writing to `UPLOAD_DIR` env var
3. Register as `STORAGE_ADAPTER` injection token in `AdminProductsModule`
4. Run tests

---

## User Story: US-006 - Coupon Management

**Linked ACs**: AC-US6-01, AC-US6-02, AC-US6-03, AC-US6-04, AC-US6-05
**Tasks**: 2 total, 2 completed

---

### T-014: Admin Coupons API

**User Story**: US-006
**Satisfies ACs**: AC-US6-01, AC-US6-02, AC-US6-03, AC-US6-04, AC-US6-05
**Status**: [x] completed

**Test Plan**:
- **Given** a valid CreateCouponDto (code, discountType, value, minOrder, maxUses, expiry, applicableCategories)
- **When** POST `/admin/coupons` is called
- **Then** a coupon is created and 201 returned
- **Given** coupons with usage data exist
- **When** GET `/admin/coupons` is called
- **Then** each coupon includes timesUsed, totalDiscountGiven, associatedRevenue from aggregation
- **Given** a coupon with resellerId
- **When** listed
- **Then** resellerName and commissionCostImpact are included
- **Given** PATCH `/admin/coupons/:id/approval` with approved=true on a pending reseller coupon
- **Then** coupon becomes active

**Test Cases**:
1. **Unit**: `apps/api/src/admin/coupons/admin-coupons.service.spec.ts`
   - testCreateCouponSetsAllFields(): Assert all DTO fields persisted in prisma.coupon.create
   - testListCouponsIncludesAggregatedUsageStats(): Assert groupBy/aggregate returns timesUsed, totalDiscountGiven, associatedRevenue
   - testToggleActiveFalse(): PATCH isActive=false, assert coupon.isActive updated
   - testApproveResellerCoupon(): approval with approved=true, assert coupon.isActive=true
   - testRejectResellerCoupon(): approval with approved=false, assert coupon.isActive=false
   - testResellerAttributionInListResponse(): Coupon with resellerId, assert resellerName field present
   - testCommissionCostImpact(): Assert cost impact calculated as commissionRate * associatedRevenue
   - **Coverage Target**: 95%

2. **Integration**: `apps/api/src/admin/coupons/admin-coupons.controller.spec.ts`
   - testCreateCouponReturns201(): Valid DTO, expect 201
   - testApproveResellerCouponReturns200(): PATCH approval, expect 200
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/api/src/admin/coupons/dto/create-coupon.dto.ts` and `update-coupon.dto.ts`
2. Create `apps/api/src/admin/coupons/admin-coupons.service.ts` with all methods
3. Create `apps/api/src/admin/coupons/admin-coupons.controller.ts`
4. Create `apps/api/src/admin/coupons/admin-coupons.module.ts`
5. Import `AdminCouponsModule` in `AdminModule`
6. Run tests

---

### T-015: Admin Coupons UI

**User Story**: US-006
**Satisfies ACs**: AC-US6-01, AC-US6-02, AC-US6-03, AC-US6-04, AC-US6-05
**Status**: [x] completed

**Test Plan**:
- **Given** the admin is on the coupons page
- **When** the page loads
- **Then** coupon list shows code, discount type, value, timesUsed, totalDiscountGiven, status, and reseller attribution where applicable
- **Given** a pending reseller coupon request exists
- **When** the admin clicks Approve
- **Then** the coupon status changes to active without a page reload
- **When** the admin toggles the active switch on any coupon
- **Then** PATCH is called and the switch reflects the new state

**Test Cases**:
1. **Unit**: `apps/admin/src/app/(dashboard)/coupons/page.test.tsx`
   - testCouponListRendersAllColumns(): Assert all column headers present including usage stats
   - testResellerCouponShowsApprovalButtons(): Mock reseller coupon with pending status, assert approve/reject buttons
   - testToggleActiveCallsPatchApi(): Click active toggle, assert PATCH /admin/coupons/:id called
   - **Coverage Target**: 85%

2. **E2E**: `apps/admin/e2e/coupons.spec.ts`
   - testCreateCoupon(): Fill create coupon form, submit, assert coupon appears in list
   - testApproveResellerCoupon(): Find pending reseller coupon, click Approve, assert status becomes Active
   - testToggleCouponInactive(): Toggle active switch off, assert coupon shows Inactive status
   - **Coverage Target**: 100% of AC scenarios

**Implementation**:
1. Create `apps/admin/src/app/(dashboard)/coupons/page.tsx`
2. Create `apps/admin/src/components/coupons/coupon-form.tsx`
3. Create `apps/admin/src/components/coupons/coupon-approval-actions.tsx`
4. Create `apps/admin/src/components/coupons/coupon-toggle.tsx` (active toggle with optimistic update)
5. Run unit tests, then E2E tests

---

## User Story: US-007 - Reseller Management and Commission Tracking

**Linked ACs**: AC-US7-01, AC-US7-02, AC-US7-03, AC-US7-04, AC-US7-05
**Tasks**: 3 total, 3 completed

---

### T-016: Admin Resellers API -- List, Approval, Commission Rate

**User Story**: US-007
**Satisfies ACs**: AC-US7-01, AC-US7-02, AC-US7-03
**Status**: [x] completed

**Test Plan**:
- **Given** resellers exist with orders
- **When** GET `/admin/resellers` is called
- **Then** each reseller shows status, orderCount, and totalRevenue aggregated from their attributed orders
- **Given** a reseller in PENDING status
- **When** PATCH `/admin/resellers/:id/status` is called with status=APPROVED
- **Then** reseller status updates to APPROVED
- **Given** PATCH `/admin/resellers/:id/commission` with rate=0.15
- **Then** the reseller's commissionRate is set to 0.15 and future commissions use this rate

**Test Cases**:
1. **Unit**: `apps/api/src/admin/resellers/admin-resellers.service.spec.ts`
   - testListResellersIncludesAggregatedStats(): Assert orderCount and totalRevenue computed per reseller
   - testApproveResellerSetsStatusApproved(): Assert status=APPROVED in prisma.reseller.update
   - testRejectResellerSetsStatusRejected(): Assert status=REJECTED
   - testSuspendResellerSetsStatusSuspended(): Assert status=SUSPENDED
   - testSetPerResellerCommissionRate(): Assert commissionRate field updated
   - testGlobalDefaultRateUsedWhenNoPerResellerRate(): Assert fallback to config default
   - **Coverage Target**: 95%

2. **Integration**: `apps/api/src/admin/resellers/admin-resellers.controller.spec.ts`
   - testGetResellersReturns200(): Expect 200 for admin
   - testPatchStatusReturns200(): Valid status update, expect 200
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/api/src/admin/resellers/dto/update-reseller-status.dto.ts` and `update-commission.dto.ts`
2. Create `apps/api/src/admin/resellers/admin-resellers.service.ts`
3. Create `apps/api/src/admin/resellers/admin-resellers.controller.ts`
4. Create `apps/api/src/admin/resellers/admin-resellers.module.ts`
5. Import `AdminResellersModule` in `AdminModule`
6. Run tests

---

### T-017: Admin Resellers API -- Payouts and CSV Export

**User Story**: US-007
**Satisfies ACs**: AC-US7-04, AC-US7-05
**Status**: [x] completed

**Test Plan**:
- **Given** commission records with various payout statuses exist
- **When** GET `/admin/resellers/payouts?status=PENDING` is called
- **Then** only PENDING payouts are returned
- **When** PATCH `/admin/resellers/payouts/:id` is called with status=PAID
- **Then** payout status updates to PAID
- **When** GET `/admin/resellers/export` is called
- **Then** a CSV response is returned with columns: resellerName, orders, revenue, commissionOwed, payoutStatus

**Test Cases**:
1. **Unit**: `apps/api/src/admin/resellers/admin-resellers.service.spec.ts`
   - testFilterPayoutsByStatus(): Assert where clause includes payoutStatus filter
   - testMarkPayoutPaidUpdatesStatus(): Assert prisma.commission.update with status=PAID
   - testCsvExportContainsAllRequiredColumns(): Assert CSV string has all 5 column headers
   - testCsvExportRowCount(): 10 resellers, assert CSV has 10 data rows + 1 header
   - **Coverage Target**: 95%

**Implementation**:
1. Add `listPayouts(filters)`, `updatePayoutStatus(id, status)`, `exportCsv()` to `AdminResellersService`
2. Add `GET /admin/resellers/payouts`, `PATCH /admin/resellers/payouts/:id`, `GET /admin/resellers/export` to controller
3. Run tests

---

### T-018: Admin Resellers UI

**User Story**: US-007
**Satisfies ACs**: AC-US7-01, AC-US7-02, AC-US7-03, AC-US7-04, AC-US7-05
**Status**: [x] completed

**Test Plan**:
- **Given** the admin is on the resellers page
- **When** the page loads
- **Then** reseller list shows name, status badge, orderCount, and totalRevenue
- **Given** a pending reseller application
- **When** the admin clicks Approve
- **Then** the status badge changes to Approved
- **Given** the admin navigates to /admin/resellers/payouts
- **Then** commission payout records are listed with status filter controls
- **When** the admin clicks Export
- **Then** a CSV file download is triggered

**Test Cases**:
1. **Unit**: `apps/admin/src/app/(dashboard)/resellers/page.test.tsx`
   - testResellerListRendersRequiredColumns(): Assert name/status/orderCount/revenue columns
   - testApproveButtonCallsPatchStatusApi(): Click Approve, assert PATCH /admin/resellers/:id/status called
   - **Coverage Target**: 85%

2. **Unit**: `apps/admin/src/app/(dashboard)/resellers/payouts/page.test.tsx`
   - testPayoutListRendersWithStatusFilter(): Assert status filter and payout table rendered
   - testMarkPaidCallsPatchApi(): Click Mark Paid, assert PATCH called
   - **Coverage Target**: 85%

3. **E2E**: `apps/admin/e2e/resellers.spec.ts`
   - testApproveReseller(): Find pending reseller, click Approve, assert status badge becomes Approved
   - testDownloadCommissionReport(): Click Export, assert file download initiated
   - **Coverage Target**: 100% of AC scenarios

**Implementation**:
1. Create `apps/admin/src/app/(dashboard)/resellers/page.tsx`
2. Create `apps/admin/src/app/(dashboard)/resellers/payouts/page.tsx`
3. Create `apps/admin/src/components/resellers/reseller-actions.tsx` (approve/reject/suspend buttons)
4. Create `apps/admin/src/components/resellers/commission-rate-input.tsx`
5. Run unit tests, then E2E tests

---

## User Story: US-008 - Customer Management

**Linked ACs**: AC-US8-01, AC-US8-02, AC-US8-03, AC-US8-04
**Tasks**: 2 total, 2 completed

---

### T-019: Admin Customers API

**User Story**: US-008
**Satisfies ACs**: AC-US8-01, AC-US8-02, AC-US8-03, AC-US8-04
**Status**: [x] completed

**Test Plan**:
- **Given** customers exist with orders across multiple channels
- **When** GET `/admin/customers` is called
- **Then** each customer shows name, email, orderCount, totalSpend, lastOrderDate aggregated across all channels
- **When** called with `?search=John`
- **Then** only customers with "John" in name, email, or phone are returned
- **When** called with `?minSpend=100&maxSpend=500`
- **Then** only customers whose totalSpend is in [100, 500] are returned
- **Given** GET `/admin/customers/:id`
- **Then** full purchase history across all channels (website + external channel orders) is returned

**Test Cases**:
1. **Unit**: `apps/api/src/admin/customers/admin-customers.service.spec.ts`
   - testListCustomersAggregatesOrderStats(): Assert orderCount, totalSpend, lastOrderDate in response
   - testSearchByNameEmailPhone(): Verify OR where clause for name/email/phone icontains
   - testFilterBySpendRange(): Verify having or subquery filter for spend between min and max
   - testCustomerDetailIncludesAllChannelOrders(): Assert orders query has no channel restriction and includes external orders
   - **Coverage Target**: 95%

2. **Integration**: `apps/api/src/admin/customers/admin-customers.controller.spec.ts`
   - testGetCustomersReturns200ForAdmin(): Expect 200
   - testGetCustomerDetailReturns404ForUnknownId(): Non-existent ID, expect 404
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/api/src/admin/customers/admin-customers.service.ts` using Prisma groupBy or raw SQL for spend aggregation
2. Create `apps/api/src/admin/customers/admin-customers.controller.ts`
3. Create `apps/api/src/admin/customers/admin-customers.module.ts`
4. Import `AdminCustomersModule` in `AdminModule`
5. Run tests

---

### T-020: Admin Customers UI

**User Story**: US-008
**Satisfies ACs**: AC-US8-01, AC-US8-02, AC-US8-03, AC-US8-04
**Status**: [x] completed

**Test Plan**:
- **Given** the admin is on the customers page
- **When** the page loads
- **Then** customer list shows name, email, orderCount, totalSpend, lastOrderDate
- **When** the admin types in the search box
- **Then** debounced search sends request and matching customers appear
- **When** the admin clicks a customer row
- **Then** the customer detail page loads showing purchase history across all channels

**Test Cases**:
1. **Unit**: `apps/admin/src/app/(dashboard)/customers/page.test.tsx`
   - testCustomerListRendersAllFiveColumns(): Assert all column headers present
   - testSearchInputUpdatesQueryParam(): Type "Jane", assert ?search=Jane in URL
   - testSpendRangeFilterApplied(): Set min/max spend inputs, assert filter params sent to API
   - **Coverage Target**: 85%

2. **Unit**: `apps/admin/src/app/(dashboard)/customers/[id]/page.test.tsx`
   - testCustomerDetailShowsPurchaseHistory(): Mock API with orders from multiple channels, assert all shown
   - **Coverage Target**: 85%

3. **E2E**: `apps/admin/e2e/customers.spec.ts`
   - testCustomerListLoads(): Navigate to /admin/customers, assert table visible with data
   - testCustomerDetailShowsCrossChannelHistory(): Click customer with multi-channel orders, assert orders from all channels listed
   - **Coverage Target**: 100% of AC scenarios

**Implementation**:
1. Create `apps/admin/src/app/(dashboard)/customers/page.tsx`
2. Create `apps/admin/src/app/(dashboard)/customers/[id]/page.tsx`
3. Create `apps/admin/src/components/customers/customer-filters.tsx` (search, spend range, date range)
4. Run unit tests, then E2E tests

---

## User Story: US-009 - Analytics and Reporting Dashboard

**Linked ACs**: AC-US9-01, AC-US9-02, AC-US9-03, AC-US9-04, AC-US9-05
**Tasks**: 3 total, 3 completed

---

### T-021: Admin Analytics API -- Revenue and Order Volume

**User Story**: US-009
**Satisfies ACs**: AC-US9-01, AC-US9-02, AC-US9-04
**Status**: [x] completed

**Test Plan**:
- **Given** orders exist across channels with various dates
- **When** GET `/admin/analytics/revenue?groupBy=channel` is called
- **Then** response is array of `{ channel, totalRevenue, orderCount }` excluding CANCELLED orders
- **When** GET `/admin/analytics/revenue?groupBy=day&from=2026-01-01&to=2026-01-31` is called
- **Then** response is time-series array of `{ date, totalRevenue }` using DATE_TRUNC('day', created_at)
- **When** GET `/admin/analytics/orders?groupBy=channel` is called
- **Then** response is `{ channel, orderCount }` per channel for the selected period

**Test Cases**:
1. **Unit**: `apps/api/src/admin/analytics/admin-analytics.service.spec.ts`
   - testRevenueByChannelUsesGroupBy(): Assert prisma.order.groupBy called with by=['channel']
   - testCancelledOrdersExcludedFromRevenue(): Assert where clause has status not CANCELLED
   - testRevenueOverTimeUsesRawSqlWithDateTrunc(): Assert $queryRaw called for time-series groupBy=day
   - testDateRangeFilterApplied(): from/to present, assert createdAt gte/lte filter in query
   - testOrderVolumeByChannelReturnsCounts(): Assert channel groupBy with _count
   - **Coverage Target**: 95%

2. **Integration**: `apps/api/src/admin/analytics/admin-analytics.controller.spec.ts`
   - testRevenueEndpointReturns200ForAdmin(): Expect 200
   - testRevenueEndpointReturns403ForCustomer(): Expect 403
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/api/src/admin/analytics/admin-analytics.service.ts` with `getRevenue(filters)`, `getOrderVolume(filters)` methods
2. Create `apps/api/src/admin/analytics/admin-analytics.controller.ts`
3. Create `apps/api/src/admin/analytics/admin-analytics.module.ts`
4. Add index to schema: `@@index([channel, createdAt, status])` on Order if not present
5. Import `AdminAnalyticsModule` in `AdminModule`
6. Run tests

---

### T-022: Admin Analytics API -- Products and Coupons

**User Story**: US-009
**Satisfies ACs**: AC-US9-03, AC-US9-05
**Status**: [x] completed

**Test Plan**:
- **Given** order line items exist
- **When** GET `/admin/analytics/products` is called
- **Then** response is a ranked list of `{ productId, productName, unitsSold, revenue }` sorted by unitsSold descending
- **When** GET `/admin/analytics/coupons` is called
- **Then** each coupon entry shows `{ couponCode, usageCount, totalDiscountGiven, ordersInfluenced }`

**Test Cases**:
1. **Unit**: `apps/api/src/admin/analytics/admin-analytics.service.spec.ts`
   - testTopProductsRankedByUnitsSoldDesc(): Assert result sorted by unitsSold desc
   - testTopProductsIncludesRevenue(): Assert revenue field calculated from OrderItem quantity * price
   - testCouponPerformanceUsageCount(): Assert usageCount from count of orders with that couponId
   - testCouponTotalDiscountGivenSummed(): Assert totalDiscountGiven sums discountAmount from orders
   - **Coverage Target**: 95%

**Implementation**:
1. Add `getTopProducts(filters)` to `AdminAnalyticsService` using Prisma groupBy on OrderItem model
2. Add `getCouponPerformance(filters)` aggregating orders by couponId
3. Add `GET /admin/analytics/products` and `GET /admin/analytics/coupons` endpoints to controller
4. Run tests

---

### T-023: Analytics Dashboard UI with Recharts

**User Story**: US-009
**Satisfies ACs**: AC-US9-01, AC-US9-02, AC-US9-03, AC-US9-04, AC-US9-05
**Status**: [x] completed

**Test Plan**:
- **Given** the admin is on the analytics page
- **When** the page loads
- **Then** five sections render: Revenue by Channel (PieChart), Revenue Over Time (LineChart), Top Products (ranked list), Order Volume by Channel (BarChart), Coupon Performance (table)
- **When** the admin changes the date range selection
- **Then** all chart sections re-fetch with the new date range and update

**Test Cases**:
1. **Unit**: `apps/admin/src/app/(dashboard)/analytics/page.test.tsx`
   - testAllFiveChartSectionsRender(): Assert 5 section containers in DOM
   - testDateRangeChangeTriggersFiveApiCalls(): Change date picker, assert all 4 analytics endpoints called with new dates
   - **Coverage Target**: 80%

2. **Unit**: `apps/admin/src/components/chart-wrapper.test.tsx`
   - testRevenuePieChartRendersWithMockData(): Mock channel data, assert PieChart from recharts renders
   - testRevenueLineChartRendersWithTimeSeries(): Mock time-series data, assert LineChart renders
   - testOrderBarChartRendersChannelData(): Mock channel counts, assert BarChart renders
   - **Coverage Target**: 80%

3. **E2E**: `apps/admin/e2e/analytics.spec.ts`
   - testAnalyticsDashboardLoads(): Navigate to /admin/analytics, assert all 5 sections visible
   - testDateRangeFilterUpdatesCharts(): Change date range, assert chart data changes
   - **Coverage Target**: 100% of AC scenarios

**Implementation**:
1. Add `recharts` to `apps/admin` package.json
2. Create `apps/admin/src/components/chart-wrapper.tsx` with typed wrappers: RevenuePieChart, RevenueLineChart, OrderBarChart
3. Create `apps/admin/src/components/analytics/date-range-picker.tsx`
4. Create `apps/admin/src/app/(dashboard)/analytics/page.tsx` with all 5 chart sections as Client Components
5. Run unit tests, then E2E tests
