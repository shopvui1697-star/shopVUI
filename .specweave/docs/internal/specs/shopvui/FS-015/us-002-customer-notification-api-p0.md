---
id: US-002
feature: FS-015
title: "Customer Notification API (P0)"
status: completed
priority: P1
created: 2026-03-14T00:00:00.000Z
tldr: "**As a** customer."
project: shopvui
---

# US-002: Customer Notification API (P0)

**Feature**: [FS-015](./FEATURE.md)

**As a** customer
**I want** API endpoints to fetch, count unread, and mark notifications as read
**So that** I can stay informed about my orders and account activity

---

## Acceptance Criteria

- [x] **AC-US2-01**: Given an authenticated customer, when GET /notifications is called, then paginated notifications are returned (default 20 per page) sorted by createdAt desc
- [x] **AC-US2-02**: Given an authenticated customer, when GET /notifications/unread-count is called, then the response contains `{ count: number }`
- [x] **AC-US2-03**: Given an authenticated customer, when PATCH /notifications/:id/read is called with a valid notification ID they own, then isRead is set to true and 200 is returned
- [x] **AC-US2-04**: Given an authenticated customer, when PATCH /notifications/:id/read is called with another user's notification ID, then 403 is returned
- [x] **AC-US2-05**: Given an authenticated customer, when PATCH /notifications/read-all is called, then all their unread notifications are marked as read

---

## Implementation

**Increment**: [0015-inbox-system](../../../../../increments/0015-inbox-system/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-004**: Customer NotificationController with AuthGuard
