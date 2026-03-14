---
id: US-003
feature: FS-006
title: "Order Detail and Status Management"
status: completed
priority: P0
created: 2026-03-11T00:00:00.000Z
tldr: "**As an** admin."
project: shopvui
---

# US-003: Order Detail and Status Management

**Feature**: [FS-006](./FEATURE.md)

**As an** admin
**I want** to view full order details and update order status
**So that** I can track and fulfill orders accurately

---

## Acceptance Criteria

- [x] **AC-US3-01**: Given an order, when the admin clicks it, then they see customer info, line items, pricing breakdown, applied coupon, and reseller attribution
- [x] **AC-US3-02**: Given an order in "pending" status, when the admin updates status to "confirmed", then the status changes and an OrderStatusHistory record is created
- [x] **AC-US3-03**: Given valid status transitions (pending->confirmed->shipping->delivered, or pending->cancelled, shipping->returned), when the admin selects a new status, then only valid next statuses are available
- [x] **AC-US3-04**: Given an order from an external channel (Shopee/TikTok), when displayed, then the external order ID and channel source are visible

---

## Implementation

**Increment**: [0006-admin-dashboard](../../../../../increments/0006-admin-dashboard/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-006**: Admin Orders API -- Bulk Actions and Order Detail
- [x] **T-007**: Admin Orders UI
