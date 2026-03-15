---
id: US-003
feature: FS-015
title: "Admin Notification API (P0)"
status: completed
priority: P1
created: 2026-03-14T00:00:00.000Z
tldr: "**As an** admin."
project: shopvui
---

# US-003: Admin Notification API (P0)

**Feature**: [FS-015](./FEATURE.md)

**As an** admin
**I want** API endpoints to fetch and manage admin notifications
**So that** I can monitor system alerts and operational events

---

## Acceptance Criteria

- [x] **AC-US3-01**: Given an authenticated admin, when GET /admin/notifications is called, then paginated admin-scoped notifications are returned sorted by createdAt desc
- [x] **AC-US3-02**: Given an authenticated admin, when PATCH /admin/notifications/:id/read is called, then the notification is marked as read
- [x] **AC-US3-03**: Given an authenticated admin, when PATCH /admin/notifications/read-all is called, then all their unread notifications are marked as read
- [x] **AC-US3-04**: Given a non-admin user, when any /admin/notifications endpoint is called, then 403 is returned

---

## Implementation

**Increment**: [0015-inbox-system](../../../../../increments/0015-inbox-system/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-005**: Admin NotificationController under /admin/notifications
