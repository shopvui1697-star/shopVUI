---
id: US-007
feature: FS-015
title: "Web App Inbox Page (P1)"
status: completed
priority: P1
created: 2026-03-14T00:00:00.000Z
tldr: "**As a** customer."
project: shopvui
---

# US-007: Web App Inbox Page (P1)

**Feature**: [FS-015](./FEATURE.md)

**As a** customer
**I want** a /account/notifications page listing all my notifications
**So that** I can review and manage my notification history

---

## Acceptance Criteria

- [x] **AC-US7-01**: Given an authenticated customer, when they visit /account/notifications, then notifications are displayed in reverse chronological order
- [x] **AC-US7-02**: Given unread notifications in the list, when displayed, then they are visually distinct from read notifications (e.g., bold or highlighted)
- [x] **AC-US7-03**: Given a notification item, when the user clicks it, then it is marked as read via PATCH /notifications/:id/read
- [x] **AC-US7-04**: Given the inbox page, when "Mark all as read" is clicked, then all notifications are marked read and the UI updates
- [x] **AC-US7-05**: Given more than 20 notifications, when the user scrolls or clicks "Load more", then the next page of notifications is fetched

---

## Implementation

**Increment**: [0015-inbox-system](../../../../../increments/0015-inbox-system/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-009**: Web App /account/notifications Inbox Page
