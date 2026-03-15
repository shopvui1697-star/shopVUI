---
id: US-004
feature: FS-015
title: "Shared NotificationService (P0)"
status: completed
priority: P1
created: 2026-03-14T00:00:00.000Z
tldr: "**As a** developer."
project: shopvui
---

# US-004: Shared NotificationService (P0)

**Feature**: [FS-015](./FEATURE.md)

**As a** developer
**I want** a shared NotificationService that creates notifications programmatically
**So that** any module (orders, commissions, admin) can trigger notifications without duplicating logic

---

## Acceptance Criteria

- [x] **AC-US4-01**: Given NotificationService.create() is called with userId, type, title, body, and optional metadata, then a Notification record is persisted
- [x] **AC-US4-02**: Given an order status change event, when the order module calls NotificationService, then an ORDER_STATUS notification is created for the customer
- [x] **AC-US4-03**: Given a commission update event, when the commission module calls NotificationService, then a COMMISSION notification is created for the reseller
- [x] **AC-US4-04**: Given an admin alert scenario, when NotificationService is called with type ADMIN_ALERT, then a notification is created for the target admin user(s)

---

## Implementation

**Increment**: [0015-inbox-system](../../../../../increments/0015-inbox-system/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-003**: NestJS NotificationModule with NotificationService
- [x] **T-006**: Wire OrdersService to Create ORDER_STATUS Notifications
