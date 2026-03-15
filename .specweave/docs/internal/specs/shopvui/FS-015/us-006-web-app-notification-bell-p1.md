---
id: US-006
feature: FS-015
title: "Web App Notification Bell (P1)"
status: completed
priority: P1
created: 2026-03-14T00:00:00.000Z
tldr: "**As a** customer."
project: shopvui
---

# US-006: Web App Notification Bell (P1)

**Feature**: [FS-015](./FEATURE.md)

**As a** customer
**I want** a notification bell icon in the navbar showing my unread count
**So that** I can see at a glance if I have new notifications

---

## Acceptance Criteria

- [x] **AC-US6-01**: Given an authenticated customer on any page, when the navbar renders, then a bell icon is visible
- [x] **AC-US6-02**: Given unread notifications exist, when the bell renders, then a badge displays the unread count (capped at "99+")
- [x] **AC-US6-03**: Given no unread notifications, when the bell renders, then no badge is shown
- [x] **AC-US6-04**: Given the bell is rendered, when the unread count is polled every 30 seconds, then the badge updates without a page reload
- [x] **AC-US6-05**: Given the bell is clicked, when the user interacts, then they are navigated to /account/notifications

---

## Implementation

**Increment**: [0015-inbox-system](../../../../../increments/0015-inbox-system/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-007**: useNotificationCount Hook and API Client (Web)
- [x] **T-008**: NotificationBell Component in Web Navbar
