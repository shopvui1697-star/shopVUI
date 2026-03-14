---
id: US-008
feature: FS-006
title: "Customer Management"
status: completed
priority: P0
created: 2026-03-11T00:00:00.000Z
tldr: "**As an** admin."
project: shopvui
---

# US-008: Customer Management

**Feature**: [FS-006](./FEATURE.md)

**As an** admin
**I want** to view and search customers with their purchase history across channels
**So that** I can understand customer behavior and provide support

---

## Acceptance Criteria

- [x] **AC-US8-01**: Given the customer list, when the admin views it, then each customer shows name, email, order count, total spend, and last order date
- [x] **AC-US8-02**: Given a customer, when the admin clicks their profile, then purchase history across all channels is displayed
- [x] **AC-US8-03**: Given the customer list, when the admin searches by name, email, or phone, then matching customers are returned
- [x] **AC-US8-04**: Given the customer list, when the admin applies filters (by total spend range, registration date), then results update accordingly

---

## Implementation

**Increment**: [0006-admin-dashboard](../../../../../increments/0006-admin-dashboard/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-019**: Admin Customers API
- [x] **T-020**: Admin Customers UI
