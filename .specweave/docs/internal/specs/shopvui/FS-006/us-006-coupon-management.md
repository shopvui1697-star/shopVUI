---
id: US-006
feature: FS-006
title: "Coupon Management"
status: completed
priority: P0
created: 2026-03-11T00:00:00.000Z
tldr: "**As an** admin."
project: shopvui
---

# US-006: Coupon Management

**Feature**: [FS-006](./FEATURE.md)

**As an** admin
**I want** to create, manage, and analyze coupons including reseller coupon requests
**So that** I can control promotions and oversee reseller discount activity

---

## Acceptance Criteria

- [x] **AC-US6-01**: Given the coupon management page, when the admin creates a coupon, then they can set code, discount type (percentage/fixed), value, min order, max uses, expiry, and applicable categories
- [x] **AC-US6-02**: Given reseller coupon requests exist, when the admin views them, then they can approve or reject each request
- [x] **AC-US6-03**: Given a coupon, when the admin toggles active/inactive, then the coupon's availability updates immediately
- [x] **AC-US6-04**: Given the coupon list, when the admin views usage statistics, then times used, total discount given, and associated revenue are displayed
- [x] **AC-US6-05**: Given reseller-created coupons, when viewing the coupon list, then reseller attribution and commission cost impact are visible

---

## Implementation

**Increment**: [0006-admin-dashboard](../../../../../increments/0006-admin-dashboard/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-014**: Admin Coupons API
- [x] **T-015**: Admin Coupons UI
