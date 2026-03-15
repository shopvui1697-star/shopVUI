---
increment: 0015-inbox-system
title: "In-App Notification Inbox System"
status: active
total_tasks: 12
completed_tasks: 12
by_user_story:
  US-001: [T-001]
  US-002: [T-004]
  US-003: [T-005]
  US-004: [T-003, T-006]
  US-005: [T-002]
  US-006: [T-007, T-008]
  US-007: [T-009]
  US-008: [T-010, T-011, T-012]
---

# Tasks: In-App Notification Inbox System

---

## User Story: US-001 - Notification Data Model

**Linked ACs**: AC-US1-01, AC-US1-02, AC-US1-03, AC-US1-04
**Tasks**: 1 total, 1 completed

### T-001: Prisma Schema — NotificationType Enum and Notification Model

**User Story**: US-001
**Satisfies ACs**: AC-US1-01, AC-US1-02, AC-US1-03, AC-US1-04
**Status**: [x] completed

**Test Plan**:
- **Given** the Prisma schema file
- **When** the migration is generated and applied
- **Then** the `notifications` table exists with all required columns, the `NotificationType` enum contains all 6 values, the User relation is resolvable, and both compound indexes exist

**Test Cases**:
1. **Unit** (schema validation): `packages/db/tests/schema.test.ts`
   - `testNotificationModelExists()`: Introspect migrated schema, assert `notifications` table has columns id, user_id, type, title, body, is_read (default false), metadata, created_at, updated_at
   - `testNotificationTypeEnumValues()`: Assert enum contains ORDER_STATUS, PAYMENT, COMMISSION, SYSTEM, ADMIN_ALERT, RESELLER
   - `testUserRelationResolvable()`: Create user + notification via Prisma, query with `include: { user: true }`, assert user populated
   - `testIndexExists()`: Query `pg_indexes` via `prisma.$queryRaw` to confirm compound indexes on (user_id, is_read, created_at) and (user_id, created_at)
   - **Coverage Target**: 90%

**Implementation**:
1. Open `packages/db/prisma/schema.prisma`
2. Add `NotificationType` enum with 6 values (ORDER_STATUS, PAYMENT, COMMISSION, SYSTEM, ADMIN_ALERT, RESELLER)
3. Add `Notification` model with all fields per plan section 3 (id cuid, userId FK with cascade delete, type enum, title, body, isRead default false, metadata Json?, createdAt, updatedAt, @@map("notifications"))
4. Add `notifications Notification[]` relation field to the `User` model
5. Add `@@index([userId, isRead, createdAt(sort: Desc)])` and `@@index([userId, createdAt(sort: Desc)])`
6. Run `npx prisma migrate dev --name add-notification-model` from `packages/db`
7. Run `npx prisma generate`
8. Run tests: `npx vitest run packages/db`

---

## User Story: US-005 - Shared TypeScript Types

**Linked ACs**: AC-US5-01, AC-US5-02
**Tasks**: 1 total, 1 completed

### T-002: Add Notification Types to @shopvui/shared

**User Story**: US-005
**Satisfies ACs**: AC-US5-01, AC-US5-02
**Status**: [x] completed

**Test Plan**:
- **Given** the `@shopvui/shared` package
- **When** it is imported in web and admin apps
- **Then** `NotificationType`, `NotificationData`, `PaginatedNotificationsResponse`, and `UnreadCountResponse` are all available with zero TypeScript build errors

**Test Cases**:
1. **Unit**: `packages/shared/src/__tests__/notification.test.ts`
   - `testNotificationTypeIsStringUnion()`: Assert all 6 type values are assignable to `NotificationType`
   - `testNotificationDataInterface()`: Construct a `NotificationData` object with all required fields and assert type compatibility
   - `testUnreadCountResponse()`: Assert `{ count: 0 }` satisfies `UnreadCountResponse`
   - `testPaginatedNotificationsResponse()`: Construct `PaginatedResponse<NotificationData>` and assert shape
   - `testReExportedFromIndex()`: Import types from `@shopvui/shared` entry point, assert they are defined
   - **Coverage Target**: 85%

2. **Build check**: `tsc --noEmit` in web and admin apps after integration (validates AC-US5-02)

**Implementation**:
1. Create `packages/shared/src/notification.ts` with `NotificationType` string union, `NotificationData` interface, `UnreadCountResponse` interface (per plan section 4.2)
2. `PaginatedNotificationsResponse` = `PaginatedResponse<NotificationData>` — re-use existing generic
3. Export all types from `packages/shared/src/index.ts`
4. Run `npx vitest run packages/shared`
5. Run `tsc --noEmit` in both `apps/web` and `apps/admin` to verify zero type mismatches

---

## User Story: US-004 - Shared NotificationService

**Linked ACs**: AC-US4-01, AC-US4-02, AC-US4-03, AC-US4-04
**Tasks**: 2 total, 2 completed

### T-003: NestJS NotificationModule with NotificationService

**User Story**: US-004
**Satisfies ACs**: AC-US4-01, AC-US4-04
**Status**: [x] completed

**Test Plan**:
- **Given** the NotificationService injected with a mocked PrismaService
- **When** `create()` is called with valid userId, type, title, body, and optional metadata
- **Then** a Notification record is persisted via `prisma.notification.create`, and the returned object matches the input data

**Test Cases**:
1. **Unit**: `apps/api/src/notification/__tests__/notification.service.spec.ts`
   - `testCreatePersistsRecord()`: Mock `prisma.notification.create`, call `service.create(...)`, assert mock called with correct args and returns created record
   - `testCreateWithMetadata()`: Call `create()` with metadata object, assert metadata passed to Prisma
   - `testCreateWithoutMetadata()`: Call `create()` without metadata, assert metadata is undefined/null in Prisma call
   - `testFindByUserReturnsPaginated()`: Mock `prisma.notification.findMany` + `count`, assert `PaginatedResponse` shape returned
   - `testGetUnreadCountReturnsNumber()`: Mock `prisma.notification.count`, assert returns number
   - `testMarkAsReadSuccess()`: Mock `prisma.notification.findUnique` (returns record owned by user), assert `prisma.notification.update` called with `{ isRead: true }`
   - `testMarkAsReadThrowsForbiddenForOtherUser()`: Mock findUnique returns record with different userId, assert `ForbiddenException` thrown
   - `testMarkAllAsReadCallsUpdateMany()`: Assert `prisma.notification.updateMany` called with `{ userId, isRead: false }` filter
   - `testAdminAlertCreatesRowPerTargetUser()`: Call `create()` with ADMIN_ALERT type for specific userId, assert one row created
   - **Coverage Target**: 95%

**Implementation**:
1. Create `apps/api/src/notification/notification.service.ts` implementing all 5 methods: `create`, `findByUser`, `getUnreadCount`, `markAsRead`, `markAllAsRead`
2. `markAsRead` fetches the record first; if `notification.userId !== userId`, throw `ForbiddenException`
3. Create `apps/api/src/notification/notification.module.ts` — imports `PrismaModule`, exports `NotificationService`
4. Run `npx vitest run apps/api/src/notification`

### T-006: Wire OrdersService to Create ORDER_STATUS Notifications

**User Story**: US-004
**Satisfies ACs**: AC-US4-02, AC-US4-03
**Status**: [x] completed

**Test Plan**:
- **Given** an order status change in OrdersService
- **When** the status transitions to CONFIRMED, SHIPPING, DELIVERED, or CANCELLED
- **Then** `NotificationService.create()` is called with type ORDER_STATUS, the customer's userId, and a descriptive title and body

**Test Cases**:
1. **Unit**: `apps/api/src/orders/__tests__/orders.service.spec.ts` (extend existing)
   - `testStatusChangeCreatesOrderStatusNotification()`: Mock `notificationService.create`, trigger status update, assert create called with `{ type: 'ORDER_STATUS', userId: order.userId, ... }`
   - `testEachStatusTransitionProducesNotification()`: Parameterized test for CONFIRMED, SHIPPING, DELIVERED, CANCELLED — each triggers one notification
   - `testCommissionUpdateCreatesCommissionNotification()`: In CommissionService tests, assert COMMISSION notification created for reseller userId on commission approval
   - **Coverage Target**: 85%

**Implementation**:
1. Import `NotificationModule` in `OrdersModule`
2. Inject `NotificationService` into `OrdersService` constructor
3. After each order status update, call `notificationService.create({ userId: order.userId, type: 'ORDER_STATUS', title: ..., body: ... })`
4. Locate commission module; inject `NotificationService` and call with type COMMISSION on commission approval
5. Run `npx vitest run apps/api/src/orders`

---

## User Story: US-002 - Customer Notification API

**Linked ACs**: AC-US2-01, AC-US2-02, AC-US2-03, AC-US2-04, AC-US2-05
**Tasks**: 1 total, 1 completed

### T-004: Customer NotificationController with AuthGuard

**User Story**: US-002
**Satisfies ACs**: AC-US2-01, AC-US2-02, AC-US2-03, AC-US2-04, AC-US2-05
**Status**: [x] completed

**Test Plan**:
- **Given** an authenticated customer JWT token
- **When** each notification endpoint is called
- **Then** the controller delegates to NotificationService with the userId from the JWT, and all ownership checks are enforced

**Test Cases**:
1. **Unit**: `apps/api/src/notification/__tests__/notification.controller.spec.ts`
   - `testGetNotificationsReturnsPaginated()`: Mock service.findByUser, assert response matches `PaginatedResponse<NotificationData>` with default page=1, pageSize=20
   - `testGetUnreadCountReturnsCount()`: Mock service.getUnreadCount, assert `{ count: N }` returned
   - `testMarkAsReadReturns200()`: Mock service.markAsRead (resolves), assert HTTP 200
   - `testMarkAsReadReturns403ForOtherUser()`: Mock service.markAsRead (throws ForbiddenException), assert HTTP 403
   - `testMarkAllAsReadReturns200()`: Mock service.markAllAsRead, assert HTTP 200
   - `testUnauthenticatedRequestReturns401()`: Call without JWT, assert 401 (AuthGuard rejects)
   - `testPaginationParamsPassedToService()`: Call GET /notifications?page=2&pageSize=10, assert service called with page=2, pageSize=10
   - **Coverage Target**: 90%

2. **Integration**: `apps/api/src/notification/__tests__/notification.controller.integration.spec.ts`
   - `testFullGetNotificationsFlow()`: Create user + notifications in test DB, GET /notifications with JWT, assert paginated response
   - `testOwnershipEnforcedOnMarkAsRead()`: Create 2 users, try to mark user2 notification as read with user1 JWT, assert 403
   - **Coverage Target**: 85%

**Implementation**:
1. Create `apps/api/src/notification/dto/get-notifications.dto.ts` with `page` (default 1, min 1) and `pageSize` (default 20, min 1, max 100) validated via class-validator
2. Create `apps/api/src/notification/notification.controller.ts` with 4 routes, all decorated with `@UseGuards(AuthGuard)` and Swagger decorators
3. Extract `userId` from `@User()` decorator — never accept userId from query or body
4. Register controller in `NotificationModule`
5. Run `npx vitest run apps/api/src/notification`

---

## User Story: US-003 - Admin Notification API

**Linked ACs**: AC-US3-01, AC-US3-02, AC-US3-03, AC-US3-04
**Tasks**: 1 total, 1 completed

### T-005: Admin NotificationController under /admin/notifications

**User Story**: US-003
**Satisfies ACs**: AC-US3-01, AC-US3-02, AC-US3-03, AC-US3-04
**Status**: [x] completed

**Test Plan**:
- **Given** an authenticated admin user
- **When** admin notification endpoints are called
- **Then** the controller returns admin-scoped notifications and non-admin requests receive 403

**Test Cases**:
1. **Unit**: `apps/api/src/admin/notifications/__tests__/admin-notifications.controller.spec.ts`
   - `testAdminGetNotificationsReturnsPaginated()`: Mock service, assert paginated response for admin userId
   - `testAdminMarkAsReadReturns200()`: Mock service.markAsRead, assert 200
   - `testAdminMarkAllAsReadReturns200()`: Mock service.markAllAsRead, assert 200
   - `testNonAdminReturns403()`: Call without AdminGuard role, assert 403 (AC-US3-04)
   - `testAdminUnreadCountEndpoint()`: Mock service.getUnreadCount, assert `{ count: N }` returned
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/api/src/admin/notifications/admin-notifications.controller.ts` with 4 routes under `@Controller('admin/notifications')`, guarded by `AdminGuard`
2. Create `apps/api/src/admin/notifications/admin-notifications.module.ts` — imports `NotificationModule`
3. Register `AdminNotificationsModule` in the root `AppModule` or existing `AdminModule`
4. Run `npx vitest run apps/api/src/admin/notifications`

---

## User Story: US-006 - Web App Notification Bell

**Linked ACs**: AC-US6-01, AC-US6-02, AC-US6-03, AC-US6-04, AC-US6-05
**Tasks**: 2 total, 0 completed

### T-007: useNotificationCount Hook and API Client (Web)

**User Story**: US-006
**Satisfies ACs**: AC-US6-04
**Status**: [x] completed

**Test Plan**:
- **Given** the `useNotificationCount` hook is mounted in a test environment
- **When** 30 seconds elapse via mocked fake timers
- **Then** the API client is called again and the returned count updates

**Test Cases**:
1. **Unit**: `apps/web/src/__tests__/hooks/useNotificationCount.test.ts`
   - `testInitialFetchOnMount()`: Mock `fetch`, render hook, assert fetch called once with `/notifications/unread-count`
   - `testPollingCallsFetchEvery30s()`: Use `vi.useFakeTimers()`, advance by 30s, assert fetch called a second time
   - `testCountUpdatesAfterPoll()`: Mock fetch returning `{ count: 5 }`, advance timer, assert `count === 5`
   - `testNoPollingWhenUnauthenticated()`: Render hook with no auth session, assert fetch not called
   - `testCleanupClearsInterval()`: Unmount hook, advance timer 30s, assert fetch not called after unmount
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/web/src/lib/api/notifications.ts` with `fetchUnreadCount()`, `fetchNotifications(page, pageSize)`, `markAsRead(id)`, `markAllAsRead()` functions
2. Create `apps/web/src/hooks/useNotificationCount.ts` using `useEffect` + `setInterval(30000)`, returns `{ count, isLoading }`
3. Hook only starts polling when user session is authenticated
4. Run `npx vitest run apps/web/src/__tests__/hooks`

### T-008: NotificationBell Component in Web Navbar

**User Story**: US-006
**Satisfies ACs**: AC-US6-01, AC-US6-02, AC-US6-03, AC-US6-05
**Status**: [x] completed

**Test Plan**:
- **Given** an authenticated customer
- **When** the navbar renders
- **Then** the bell icon is visible; a red badge shows the capped unread count when > 0; no badge shows when count is 0; clicking navigates to /account/notifications

**Test Cases**:
1. **Unit**: `apps/web/src/__tests__/components/NotificationBell.test.tsx`
   - `testBellIconRendersWhenAuthenticated()`: Render with mock session, assert bell icon in DOM
   - `testBadgeShowsWhenUnreadCountPositive()`: Render with count=5, assert badge text "5" visible
   - `testBadgeShowsCapAt99Plus()`: Render with count=150, assert badge text "99+"
   - `testNoBadgeWhenCountZero()`: Render with count=0, assert badge not in DOM
   - `testLinkToNotificationsPage()`: Assert component is wrapped in Link pointing to `/account/notifications`
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/web/src/components/layout/navbar/NotificationBell.tsx`
   - Uses `BellIcon` from `@heroicons/react/24/outline`
   - Calls `useNotificationCount()` for the count
   - Badge: renders only when count > 0, displays `count > 99 ? '99+' : String(count)`
   - Wrapped in `<Link href="/account/notifications">`
2. Edit `apps/web/src/components/layout/navbar/index.tsx` — add `<NotificationBell />` before the user avatar/dropdown
3. Run `npx vitest run apps/web/src/__tests__/components`

---

## User Story: US-007 - Web App Inbox Page

**Linked ACs**: AC-US7-01, AC-US7-02, AC-US7-03, AC-US7-04, AC-US7-05
**Tasks**: 1 total, 0 completed

### T-009: Web App /account/notifications Inbox Page

**User Story**: US-007
**Satisfies ACs**: AC-US7-01, AC-US7-02, AC-US7-03, AC-US7-04, AC-US7-05
**Status**: [x] completed

**Test Plan**:
- **Given** an authenticated customer visits /account/notifications
- **When** the page loads
- **Then** notifications are listed newest-first; unread items are visually distinct; clicking an item calls PATCH to mark it read; "Mark all" button marks all read; "Load more" fetches the next page

**Test Cases**:
1. **Unit**: `apps/web/src/__tests__/pages/NotificationsPage.test.tsx`
   - `testNotificationsListedNewestFirst()`: Mock API returning 3 notifications in order, assert render order matches createdAt desc
   - `testUnreadItemHasDistinctStyle()`: Mock notification with isRead=false, assert element has bold/highlight class
   - `testReadItemHasNormalStyle()`: Mock notification with isRead=true, assert element does not have highlight class
   - `testClickingItemCallsMarkAsRead()`: Mock `markAsRead`, click notification row, assert mock called with notification id
   - `testMarkAllButtonCallsMarkAllAsRead()`: Mock `markAllAsRead`, click "Mark all as read" button, assert mock called
   - `testLoadMoreFetchesNextPage()`: Mock first page response with hasMore=true, click "Load more", assert fetch called with page=2
   - `testLoadMoreButtonHiddenWhenNoMorePages()`: Mock response with hasMore=false, assert "Load more" not rendered
   - **Coverage Target**: 85%

2. **E2E** (Playwright): `apps/web/e2e/notifications.spec.ts`
   - `testInboxPageLoads()`: Login as customer, navigate to /account/notifications, assert page heading visible
   - `testMarkAsRead()`: Seed an unread notification, click it, assert item no longer has unread styling
   - `testMarkAllAsRead()`: Seed 3 unread notifications, click "Mark all as read", assert all show as read
   - **Coverage Target**: 100% of AC scenarios

**Implementation**:
1. Create `apps/web/src/app/account/notifications/page.tsx` as a client component
2. On mount: fetch page 1 via `fetchNotifications(1, 20)`
3. List items — unread: `font-bold bg-blue-50` (or equivalent Tailwind), read: default style
4. Click handler: call `markAsRead(id)`, update local state to reflect read status
5. "Mark all as read" button: call `markAllAsRead()`, update all items in local state to isRead=true
6. "Load more" button: fetch next page, append results; hide button when response indicates no more pages
7. Run `npx vitest run apps/web/src/__tests__/pages` then `npx playwright test apps/web/e2e/notifications.spec.ts`

---

## User Story: US-008 - Admin App Notification Bell and Inbox

**Linked ACs**: AC-US8-01, AC-US8-02, AC-US8-03, AC-US8-04
**Tasks**: 3 total, 3 completed

### T-010: Admin API Client and useNotificationCount Hook

**User Story**: US-008
**Satisfies ACs**: AC-US8-01
**Status**: [x] completed

**Test Plan**:
- **Given** the admin app `useNotificationCount` hook is mounted
- **When** 30 seconds elapse via mocked fake timers
- **Then** the hook polls `/admin/notifications/unread-count` and updates the count

**Test Cases**:
1. **Unit**: `apps/admin/src/__tests__/hooks/useNotificationCount.test.ts`
   - `testInitialFetchOnMount()`: Mock fetch, render hook, assert called with `/admin/notifications/unread-count`
   - `testPollingEvery30s()`: Fake timers, advance 30s, assert fetch called again
   - `testCountUpdatesAfterPoll()`: Mock response `{ count: 3 }`, advance timer, assert count=3
   - `testCleanupOnUnmount()`: Unmount, advance timer 30s, assert fetch not called after unmount
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/admin/src/lib/api/notifications.ts` with admin-scoped functions hitting `/admin/notifications/*`
2. Create `apps/admin/src/hooks/useNotificationCount.ts` (same polling pattern as web app hook)
3. Run `npx vitest run apps/admin/src/__tests__/hooks`

### T-011: Admin NotificationBell in Admin Header

**User Story**: US-008
**Satisfies ACs**: AC-US8-01, AC-US8-02
**Status**: [x] completed

**Test Plan**:
- **Given** an authenticated admin views any admin page
- **When** the header renders
- **Then** a bell icon with unread badge is visible; clicking navigates to /notifications

**Test Cases**:
1. **Unit**: `apps/admin/src/__tests__/components/NotificationBell.test.tsx`
   - `testBellRendersWithBadge()`: Render with count=2, assert badge "2" visible
   - `testNoBadgeWhenZero()`: Render with count=0, assert badge not rendered
   - `testBadgeCapsAt99Plus()`: Render with count=200, assert badge text "99+"
   - `testNavigatesToNotificationsPage()`: Assert Link href="/notifications"
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/admin/src/components/NotificationBell.tsx` (bell icon + badge + Link to /notifications)
2. Edit `apps/admin/src/components/header.tsx` — integrate `<NotificationBell />` between title and logout button
3. Run `npx vitest run apps/admin/src/__tests__/components`

### T-012: Admin /notifications Inbox Page

**User Story**: US-008
**Satisfies ACs**: AC-US8-03, AC-US8-04
**Status**: [x] completed

**Test Plan**:
- **Given** an authenticated admin visits /notifications
- **When** the page loads
- **Then** notifications are listed newest-first with read/unread distinction; "Mark all" marks all as read and the UI updates

**Test Cases**:
1. **Unit**: `apps/admin/src/__tests__/pages/NotificationsPage.test.tsx`
   - `testNotificationsListedNewestFirst()`: Mock API response, assert render order is newest-first
   - `testUnreadDistinctFromRead()`: Mock mix of read/unread notifications, assert unread has distinct CSS class
   - `testMarkAllAsReadButton()`: Mock `markAllAsRead`, click button, assert mock called and all items show as read
   - `testEmptyStateMessage()`: Mock empty response, assert "No notifications" message rendered
   - **Coverage Target**: 85%

2. **E2E** (Playwright): `apps/admin/e2e/notifications.spec.ts`
   - `testAdminInboxPageLoads()`: Login as admin, navigate to /notifications, assert notification list renders
   - `testAdminMarkAllAsRead()`: Seed admin notification, click "Mark all as read", assert UI updates to show all read
   - **Coverage Target**: 100% of AC scenarios

**Implementation**:
1. Create `apps/admin/src/app/notifications/page.tsx` as a client component
2. Fetch admin notifications on mount via `fetchAdminNotifications(1, 20)`
3. Unread visual distinction (bold/highlighted), read/unread state managed locally
4. "Mark all as read" calls `markAllAsRead()`, updates local state to isRead=true for all items
5. Run `npx vitest run apps/admin/src/__tests__/pages` then `npx playwright test apps/admin/e2e/notifications.spec.ts`
