# Architecture Plan: 0015 In-App Notification Inbox System

## 1. Overview

A notification inbox system spanning the full stack: Prisma data model, NestJS API module, shared TypeScript types, and UI components in both web (customer) and admin apps. Polling-based MVP, no WebSocket.

## 2. Architecture Decisions

### AD-1: Single Notification Table, Multi-Role

One `Notification` table with a `userId` FK serves all roles (CUSTOMER, ADMIN, RESELLER). The `type` enum discriminates notification categories. No separate tables per role.

**Why**: The query pattern is identical across roles -- "get my notifications, ordered by date, filtered by read status." Role-specific filtering happens via the `type` enum and the `userId` FK. A single table avoids schema duplication and keeps the NotificationService API simple.

**Trade-off**: If admin notifications later need broadcast semantics (one notification to all admins), a `targetRole` column or a junction table would be needed. For MVP, spec says notifications target individual users (AC-US4-04: "target admin user(s)"), so we create one row per target user.

### AD-2: NotificationService as NestJS Injectable, Not a Separate Module Export

`NotificationService` lives in `apps/api/src/notification/notification.service.ts` and is exported from `NotificationModule`. Other modules (orders, commissions) import `NotificationModule` to access the service via DI.

**Why**: This follows the existing cross-cutting service pattern (like `EmailModule`/`EmailService`). Direct Prisma import is used inside the service (consistent with ADR-0002), but the service itself is shared via NestJS module exports, not raw function imports. This keeps notification creation testable and mockable.

### AD-3: Offset-Based Pagination (Reuse Existing Pattern)

The project already uses offset-based pagination via `PaginatedResponse<T>` in `@shopvui/shared`. Notification endpoints will use the same `page` + `pageSize` parameters and return the same shape.

**Why**: Consistency with existing APIs. Cursor-based pagination offers better performance for large datasets with frequent inserts, but the existing pattern is offset-based, and notification volumes per user are unlikely to warrant the migration. The compound index on `(userId, isRead, createdAt)` keeps offset queries fast.

### AD-4: Polling Hook, Not Global State

A `useNotificationCount` hook using `useEffect` + `setInterval` (30s) fetches the unread count. No global state manager (Redux, Zustand) is introduced.

**Why**: The unread count is the only piece of cross-page reactive state, and it only needs to be accurate within 30 seconds. A simple hook with `useState` is sufficient. If real-time is added later, the hook's internal implementation can swap to WebSocket without changing the consumer API.

### AD-5: Separate Customer and Admin API Controllers

Customer notifications are at `/notifications/*` (in `apps/api/src/notification/`). Admin notifications are at `/admin/notifications/*` (in `apps/api/src/admin/notifications/`). Both use the same `NotificationService` for shared logic.

**Why**: Follows ADR-0002 (Admin API Design Pattern). Admin endpoints live under `/admin/*` with `AdminGuard`. Customer endpoints use the existing JWT `AuthGuard`. The service layer is shared; only the controller + guard layer differs.

## 3. Data Model

### Prisma Schema Addition

```prisma
enum NotificationType {
  ORDER_STATUS
  PAYMENT
  COMMISSION
  SYSTEM
  ADMIN_ALERT
  RESELLER
}

model Notification {
  id        String           @id @default(cuid())
  userId    String           @map("user_id")
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      NotificationType
  title     String
  body      String
  isRead    Boolean          @default(false) @map("is_read")
  metadata  Json?
  createdAt DateTime         @default(now()) @map("created_at")
  updatedAt DateTime         @updatedAt @map("updated_at")

  @@index([userId, isRead, createdAt(sort: Desc)])
  @@index([userId, createdAt(sort: Desc)])
  @@map("notifications")
}
```

The `User` model gets a `notifications Notification[]` relation field.

**Index rationale**:
- `(userId, isRead, createdAt DESC)` -- covers the unread-count query (`WHERE userId = ? AND isRead = false`) and the filtered inbox query
- `(userId, createdAt DESC)` -- covers the "all notifications" paginated query

## 4. Component Breakdown

### 4.1 packages/db (Prisma)

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `NotificationType` enum, `Notification` model, `notifications` relation on `User` |

### 4.2 packages/shared (Types)

| File | Purpose |
|------|---------|
| `src/notification.ts` | `NotificationType` string union, `NotificationData` interface, `UnreadCountResponse` interface |
| `src/index.ts` | Re-export notification types |

```typescript
// packages/shared/src/notification.ts
export type NotificationType =
  | 'ORDER_STATUS'
  | 'PAYMENT'
  | 'COMMISSION'
  | 'SYSTEM'
  | 'ADMIN_ALERT'
  | 'RESELLER';

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string; // ISO string
}

export interface UnreadCountResponse {
  count: number;
}
```

Pagination uses the existing `PaginatedResponse<NotificationData>` -- no new pagination type needed.

### 4.3 apps/api -- Notification Module (Customer)

```
apps/api/src/notification/
  notification.module.ts    -- exports NotificationService
  notification.service.ts   -- CRUD + create() for producers
  notification.controller.ts -- GET /notifications, GET /notifications/unread-count,
                                PATCH /notifications/:id/read, PATCH /notifications/read-all
  dto/
    get-notifications.dto.ts -- page, pageSize query params
```

**NotificationService API**:

```typescript
class NotificationService {
  // Producer API (called by other modules)
  async create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    metadata?: Record<string, unknown>;
  }): Promise<Notification>;

  // Consumer API (called by controllers)
  async findByUser(userId: string, page: number, pageSize: number): Promise<PaginatedResponse<NotificationData>>;
  async getUnreadCount(userId: string): Promise<number>;
  async markAsRead(id: string, userId: string): Promise<void>;  // throws ForbiddenException if not owner
  async markAllAsRead(userId: string): Promise<void>;
}
```

**Controller routes** (all guarded by `AuthGuard`):

| Method | Path | Handler |
|--------|------|---------|
| GET | `/notifications` | `findAll` -- paginated, uses `userId` from JWT |
| GET | `/notifications/unread-count` | `getUnreadCount` |
| PATCH | `/notifications/:id/read` | `markAsRead` -- ownership check |
| PATCH | `/notifications/read-all` | `markAllAsRead` |

### 4.4 apps/api -- Admin Notification Controller

```
apps/api/src/admin/notifications/
  admin-notifications.module.ts
  admin-notifications.controller.ts
```

**Controller routes** (all guarded by `AdminGuard`):

| Method | Path | Handler |
|--------|------|---------|
| GET | `/admin/notifications` | `findAll` -- paginated, admin userId from JWT |
| GET | `/admin/notifications/unread-count` | `getUnreadCount` |
| PATCH | `/admin/notifications/:id/read` | `markAsRead` |
| PATCH | `/admin/notifications/read-all` | `markAllAsRead` |

The admin controller imports `NotificationModule` and delegates directly to `NotificationService` since the data model is the same -- admin notifications are just `Notification` rows where the `userId` belongs to an admin user. No separate service needed.

### 4.5 apps/web -- Notification Bell + Inbox

| File | Purpose |
|------|---------|
| `src/lib/api/notifications.ts` | API client functions (`fetchNotifications`, `fetchUnreadCount`, `markAsRead`, `markAllAsRead`) |
| `src/hooks/useNotificationCount.ts` | Polling hook (30s interval), returns `{ count, isLoading }` |
| `src/components/layout/navbar/NotificationBell.tsx` | Bell icon + badge, links to `/account/notifications` |
| `src/components/layout/navbar/index.tsx` | Integrate `NotificationBell` next to user dropdown (before the avatar button) |
| `src/app/account/notifications/page.tsx` | Inbox page with notification list, mark-read, load-more |

**NotificationBell component**:
- Renders `BellIcon` from `@heroicons/react/24/outline`
- Shows red badge with count (capped at "99+")
- No badge when count is 0
- Wrapped in `<Link href="/account/notifications">`
- Only renders when user is authenticated

**Inbox page**:
- Client component for interactivity
- Notification list with unread visual distinction (bold title, highlighted background)
- Click notification row to mark as read via PATCH
- "Mark all as read" button at top
- "Load more" button at bottom (increments page, appends results)

### 4.6 apps/admin -- Notification Bell + Inbox

| File | Purpose |
|------|---------|
| `src/lib/api/notifications.ts` | Admin API client functions (hit `/admin/notifications/*` endpoints) |
| `src/hooks/useNotificationCount.ts` | Same polling pattern, hits admin endpoint |
| `src/components/NotificationBell.tsx` | Bell icon + badge for admin header |
| `src/components/header.tsx` | Integrate bell into existing header (between title and logout button) |
| `src/app/notifications/page.tsx` | Admin inbox page |

## 5. Data Flow

```
Producer (OrdersService, CommissionService, etc.)
    |
    v
NotificationService.create({ userId, type, title, body, metadata })
    |
    v
Prisma INSERT into notifications table
    |
    v
[30s later] useNotificationCount polls GET /notifications/unread-count
    |
    v
Badge updates in Navbar/Header
    |
    v
User clicks bell -> /account/notifications (or /notifications in admin)
    |
    v
GET /notifications?page=1&pageSize=20 -> PaginatedResponse<NotificationData>
    |
    v
User clicks notification -> PATCH /notifications/:id/read
```

## 6. Integration Points (Notification Producers)

These are the intended call sites for NotificationService. AC-US4-02 through AC-US4-04 require at least one wired integration.

| Module | Event | Notification Type | Target |
|--------|-------|-------------------|--------|
| Orders | Status change (CONFIRMED, SHIPPING, DELIVERED, CANCELLED) | ORDER_STATUS | Customer (order.userId) |
| Orders | Payment received | PAYMENT | Customer |
| Commissions | Commission approved | COMMISSION | Reseller (via reseller.userId) |
| Commissions | Commission paid | COMMISSION | Reseller |
| Admin | System alert | ADMIN_ALERT | Specific admin user(s) |

For this increment, the orders module status change is the simplest to wire (it already has status transition logic). Commission notifications can be added as a follow-up.

## 7. Security Considerations

- **Ownership enforcement**: `markAsRead` verifies `notification.userId === requestingUserId` before updating. Returns 403 on mismatch (AC-US2-04).
- **No cross-user data leakage**: All queries filter by `userId` from JWT. Never accept `userId` from request params/body.
- **Admin isolation**: Admin endpoints use `AdminGuard` (per ADR-0002). Admin queries filter by the admin's own `userId`.
- **Input validation**: Pagination params validated via class-validator DTOs (`page >= 1`, `pageSize` between 1 and 100).

## 8. Implementation Order

1. **T-001**: Prisma schema -- add `NotificationType` enum and `Notification` model, run migration
2. **T-002**: Shared types -- add `notification.ts` to `@shopvui/shared`, re-export from index
3. **T-003**: NotificationService + NotificationModule -- create(), findByUser(), getUnreadCount(), markAsRead(), markAllAsRead()
4. **T-004**: Customer NotificationController -- wire routes with AuthGuard, Swagger decorators
5. **T-005**: Admin NotificationController -- wire routes under /admin/ with AdminGuard
6. **T-006**: Wire OrdersService integration -- create ORDER_STATUS notification on status change
7. **T-007**: Web app API client + useNotificationCount hook
8. **T-008**: Web app NotificationBell in navbar
9. **T-009**: Web app /account/notifications inbox page
10. **T-010**: Admin app API client + useNotificationCount hook
11. **T-011**: Admin app NotificationBell in header
12. **T-012**: Admin app /notifications inbox page

## 9. Testing Strategy

- **Unit tests** (Vitest): NotificationService methods with mocked Prisma client
- **Controller tests**: Route-level tests verifying auth guards, pagination params, ownership checks
- **Integration tests**: Full request cycle through NestJS test module with test database
- **E2E tests** (Playwright): Bell badge visibility, inbox page load, mark-as-read interaction

## 10. Domain Skill Recommendations

After plan approval, invoke:
- **`backend:nodejs`** -- NestJS module implementation (T-003 through T-006)
- **`frontend:architect`** -- React component patterns, hook design, page layout (T-007 through T-012)
