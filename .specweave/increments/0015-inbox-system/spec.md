---
increment: 0015-inbox-system
title: In-App Notification Inbox System
type: feature
priority: P1
status: completed
created: 2026-03-14T00:00:00.000Z
structure: user-stories
test_mode: TDD
coverage_target: 80
---

# In-App Notification Inbox System

## Problem Statement

ShopVui currently has no in-app notification mechanism. Users (customers, admins, resellers) only receive email notifications via Nodemailer. This means users must leave the app to check updates about orders, commissions, and system alerts. An in-app inbox reduces friction and increases engagement by surfacing relevant events directly in the UI.

## Goals

- Provide a unified notification data model supporting all roles (CUSTOMER, ADMIN, RESELLER)
- Expose RESTful APIs for reading and managing notifications per role
- Add notification bell with unread badge and inbox page to both web and admin apps
- Create a shared NotificationService that other modules can call to create notifications
- Use polling for MVP (no WebSocket)

## User Stories

### US-001: Notification Data Model (P0)
**Project**: shopvui

**As a** developer
**I want** a Notification database model with type enum, read status, and metadata
**So that** the system can persist and query notifications for any user

**Acceptance Criteria**:
- [x] **AC-US1-01**: Given the Prisma schema, when a migration runs, then a `Notification` table exists with columns: id, userId (FK to User), type (enum), title, body, isRead (default false), metadata (JSON), createdAt, updatedAt
- [x] **AC-US1-02**: Given the NotificationType enum, when referenced, then it includes ORDER_STATUS, PAYMENT, COMMISSION, SYSTEM, ADMIN_ALERT, RESELLER
- [x] **AC-US1-03**: Given a Notification record, when queried, then it resolves its associated User via the userId foreign key
- [x] **AC-US1-04**: Given the Notification table, when queried by userId and isRead, then results are returned ordered by createdAt descending with index support

---

### US-002: Customer Notification API (P0)
**Project**: shopvui

**As a** customer
**I want** API endpoints to fetch, count unread, and mark notifications as read
**So that** I can stay informed about my orders and account activity

**Acceptance Criteria**:
- [x] **AC-US2-01**: Given an authenticated customer, when GET /notifications is called, then paginated notifications are returned (default 20 per page) sorted by createdAt desc
- [x] **AC-US2-02**: Given an authenticated customer, when GET /notifications/unread-count is called, then the response contains `{ count: number }`
- [x] **AC-US2-03**: Given an authenticated customer, when PATCH /notifications/:id/read is called with a valid notification ID they own, then isRead is set to true and 200 is returned
- [x] **AC-US2-04**: Given an authenticated customer, when PATCH /notifications/:id/read is called with another user's notification ID, then 403 is returned
- [x] **AC-US2-05**: Given an authenticated customer, when PATCH /notifications/read-all is called, then all their unread notifications are marked as read

---

### US-003: Admin Notification API (P0)
**Project**: shopvui

**As an** admin
**I want** API endpoints to fetch and manage admin notifications
**So that** I can monitor system alerts and operational events

**Acceptance Criteria**:
- [x] **AC-US3-01**: Given an authenticated admin, when GET /admin/notifications is called, then paginated admin-scoped notifications are returned sorted by createdAt desc
- [x] **AC-US3-02**: Given an authenticated admin, when PATCH /admin/notifications/:id/read is called, then the notification is marked as read
- [x] **AC-US3-03**: Given an authenticated admin, when PATCH /admin/notifications/read-all is called, then all their unread notifications are marked as read
- [x] **AC-US3-04**: Given a non-admin user, when any /admin/notifications endpoint is called, then 403 is returned

---

### US-004: Shared NotificationService (P0)
**Project**: shopvui

**As a** developer
**I want** a shared NotificationService that creates notifications programmatically
**So that** any module (orders, commissions, admin) can trigger notifications without duplicating logic

**Acceptance Criteria**:
- [x] **AC-US4-01**: Given NotificationService.create() is called with userId, type, title, body, and optional metadata, then a Notification record is persisted
- [x] **AC-US4-02**: Given an order status change event, when the order module calls NotificationService, then an ORDER_STATUS notification is created for the customer
- [x] **AC-US4-03**: Given a commission update event, when the commission module calls NotificationService, then a COMMISSION notification is created for the reseller
- [x] **AC-US4-04**: Given an admin alert scenario, when NotificationService is called with type ADMIN_ALERT, then a notification is created for the target admin user(s)

---

### US-005: Shared TypeScript Types (P1)
**Project**: shopvui

**As a** developer
**I want** notification-related types exported from @shopvui/shared
**So that** web, admin, and API apps share a single source of truth for notification interfaces

**Acceptance Criteria**:
- [x] **AC-US5-01**: Given @shopvui/shared, when imported, then NotificationType enum, Notification interface, PaginatedNotificationsResponse, and UnreadCountResponse types are available
- [x] **AC-US5-02**: Given the API response shape, when the shared types are used in web and admin apps, then there are zero type mismatches at build time

---

### US-006: Web App Notification Bell (P1)
**Project**: shopvui

**As a** customer
**I want** a notification bell icon in the navbar showing my unread count
**So that** I can see at a glance if I have new notifications

**Acceptance Criteria**:
- [x] **AC-US6-01**: Given an authenticated customer on any page, when the navbar renders, then a bell icon is visible
- [x] **AC-US6-02**: Given unread notifications exist, when the bell renders, then a badge displays the unread count (capped at "99+")
- [x] **AC-US6-03**: Given no unread notifications, when the bell renders, then no badge is shown
- [x] **AC-US6-04**: Given the bell is rendered, when the unread count is polled every 30 seconds, then the badge updates without a page reload
- [x] **AC-US6-05**: Given the bell is clicked, when the user interacts, then they are navigated to /account/notifications

---

### US-007: Web App Inbox Page (P1)
**Project**: shopvui

**As a** customer
**I want** a /account/notifications page listing all my notifications
**So that** I can review and manage my notification history

**Acceptance Criteria**:
- [x] **AC-US7-01**: Given an authenticated customer, when they visit /account/notifications, then notifications are displayed in reverse chronological order
- [x] **AC-US7-02**: Given unread notifications in the list, when displayed, then they are visually distinct from read notifications (e.g., bold or highlighted)
- [x] **AC-US7-03**: Given a notification item, when the user clicks it, then it is marked as read via PATCH /notifications/:id/read
- [x] **AC-US7-04**: Given the inbox page, when "Mark all as read" is clicked, then all notifications are marked read and the UI updates
- [x] **AC-US7-05**: Given more than 20 notifications, when the user scrolls or clicks "Load more", then the next page of notifications is fetched

---

### US-008: Admin App Notification Bell and Inbox (P1)
**Project**: shopvui

**As an** admin
**I want** a notification bell in the admin header and a /notifications page
**So that** I can monitor and manage admin alerts and system notifications

**Acceptance Criteria**:
- [x] **AC-US8-01**: Given an authenticated admin, when the admin header renders, then a bell icon with unread badge is visible (polling every 30s)
- [x] **AC-US8-02**: Given the admin bell is clicked, when interacted with, then navigation goes to /notifications
- [x] **AC-US8-03**: Given the /notifications admin page, when loaded, then admin notifications are listed in reverse chronological order with read/unread distinction
- [x] **AC-US8-04**: Given the admin inbox, when "Mark all as read" is clicked, then all admin notifications are marked read

## Out of Scope

- WebSocket / real-time push (future increment -- polling only for MVP)
- Email notification integration (already exists via Nodemailer, not modified here)
- Notification preferences / opt-out settings
- Push notifications (mobile / browser)
- Notification templates or rich HTML content
- Bulk notification creation admin UI (admin can only read, not compose)

## Technical Notes

- Prisma model in `packages/db/prisma/schema.prisma`
- NestJS module: `apps/api/src/notification/` with controller, service, module
- Shared types: `packages/shared/src/types/notification.ts`
- Web bell: integrate into existing navbar (`apps/web/src/components/layout/navbar/`)
- Admin bell: integrate into existing admin header layout
- Polling: use React `useEffect` + `setInterval` or a custom `useNotificationCount` hook
- Pagination: cursor-based or offset-based, consistent with existing API patterns

## Success Metrics

- 80%+ of active customers view at least one in-app notification within 30 days of launch
- Average unread count response time under 50ms (indexed query)
- Zero notification data leakage between users (authorization enforced on all endpoints)
