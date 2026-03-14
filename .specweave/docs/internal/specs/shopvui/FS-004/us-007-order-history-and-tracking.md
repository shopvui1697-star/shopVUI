---
id: US-007
feature: FS-004
title: "Order History and Tracking"
status: completed
priority: P0
created: 2026-03-11T00:00:00.000Z
tldr: "**As a** customer."
project: shopvui
---

# US-007: Order History and Tracking

**Feature**: [FS-004](./FEATURE.md)

**As a** customer
**I want** to view my past orders and their current status
**So that** I can track deliveries and reference previous purchases

---

## Acceptance Criteria

- [x] **AC-US7-01**: Given I am logged in, when I navigate to "My Orders", then I see a paginated list of my orders sorted by most recent, showing order number, date, total, and status
- [x] **AC-US7-02**: Given I click on an order, when the detail page loads, then I see all line items with quantities and prices, applied coupon, shipping fee, payment method, delivery address, and status history
- [x] **AC-US7-03**: Given an order status changes (e.g., from "confirmed" to "shipping"), then the status history records the transition timestamp and the new status is reflected on the order detail page
- [x] **AC-US7-04**: Given I have an order with status "pending" (not yet confirmed), when I click "Cancel Order", then the order status changes to "cancelled" and any payment hold is released

---

## Implementation

**Increment**: [0004-ecommerce-flow](../../../../../increments/0004-ecommerce-flow/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-031**: OrderModule - Backend Endpoints (List, Detail, Cancel)
- [x] **T-032**: Order Status History Recording
- [x] **T-033**: Order List Page - Frontend
- [x] **T-034**: Order Detail Page - Frontend with Status History
