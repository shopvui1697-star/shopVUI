---
id: US-003
feature: FS-005
title: "Order Flow with Reseller Coupon"
status: completed
priority: P1
created: 2026-03-11T00:00:00.000Z
tldr: "**As a** customer."
project: shopvui
---

# US-003: Order Flow with Reseller Coupon

**Feature**: [FS-005](./FEATURE.md)

**As a** customer
**I want** to use a reseller's coupon code at checkout
**So that** I get a discount while the reseller earns commission

---

## Acceptance Criteria

- [x] **AC-US3-01**: Given a valid reseller coupon "ANNA10" (10% off), when I apply it at checkout with subtotal 3,000,000 VND, then discount of 300,000 VND is applied and the order records resellerId from the coupon
- [x] **AC-US3-02**: Given an order is placed with a reseller coupon, then a Commission record is created with status "pending", the couponCode, orderTotal, and calculated commissionAmount
- [x] **AC-US3-03**: Given commission_type is "percentage" and commission_value is 5 and commission_base is "final_total", when order final total (after discount + shipping) is 2,730,000 VND, then commissionAmount is 136,500 VND
- [x] **AC-US3-04**: Given commission_type is "fixed" and commission_value is 50,000, when any order is placed with this reseller coupon, then commissionAmount is 50,000 VND regardless of order total
- [x] **AC-US3-05**: Given an order with a reseller coupon, then the order's channel field is set to "reseller"

---

## Implementation

**Increment**: [0005-reseller-system](../../../../../increments/0005-reseller-system/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-007**: Commission Calculation Service
- [x] **T-008**: Checkout Integration - Commission Creation on Order Placement
- [x] **T-009**: Order Status Hooks - Commission Lifecycle Triggers
