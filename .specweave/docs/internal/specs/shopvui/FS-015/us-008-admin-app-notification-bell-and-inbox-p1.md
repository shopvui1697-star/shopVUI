---
id: US-008
feature: FS-015
title: "Admin App Notification Bell and Inbox (P1)"
status: completed
priority: P1
created: 2026-03-14T00:00:00.000Z
tldr: "**As an** admin."
project: shopvui
---

# US-008: Admin App Notification Bell and Inbox (P1)

**Feature**: [FS-015](./FEATURE.md)

**As an** admin
**I want** a notification bell in the admin header and a /notifications page
**So that** I can monitor and manage admin alerts and system notifications

---

## Acceptance Criteria

- [x] **AC-US8-01**: Given an authenticated admin, when the admin header renders, then a bell icon with unread badge is visible (polling every 30s)
- [x] **AC-US8-02**: Given the admin bell is clicked, when interacted with, then navigation goes to /notifications
- [x] **AC-US8-03**: Given the /notifications admin page, when loaded, then admin notifications are listed in reverse chronological order with read/unread distinction
- [x] **AC-US8-04**: Given the admin inbox, when "Mark all as read" is clicked, then all admin notifications are marked read

---

## Implementation

**Increment**: [0015-inbox-system](../../../../../increments/0015-inbox-system/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-010**: Admin API Client and useNotificationCount Hook
- [x] **T-011**: Admin NotificationBell in Admin Header
- [x] **T-012**: Admin /notifications Inbox Page
