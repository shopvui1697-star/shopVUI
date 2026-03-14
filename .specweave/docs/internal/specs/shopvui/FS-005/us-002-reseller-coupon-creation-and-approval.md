---
id: US-002
feature: FS-005
title: "Reseller Coupon Creation and Approval"
status: completed
priority: P1
created: 2026-03-11T00:00:00.000Z
tldr: "**As an** active reseller."
project: shopvui
---

# US-002: Reseller Coupon Creation and Approval

**Feature**: [FS-005](./FEATURE.md)

**As an** active reseller
**I want** to propose a unique coupon code with my preferred name
**So that** I can share it with my audience for tracked purchases

---

## Acceptance Criteria

- [x] **AC-US2-01**: Given I am an active reseller on the portal, when I submit a proposed coupon code (e.g., "ANNA10"), then a coupon request is created linking to my reseller ID with status awaiting admin approval
- [x] **AC-US2-02**: Given I propose a code that already exists in the system, when I submit, then I receive an error "Coupon code already taken" and must choose another
- [x] **AC-US2-03**: Given an admin reviews my coupon request, when they approve it, then the Coupon record is created with isResellerCoupon=true, my resellerId, admin-set discount value, commission_type, commission_value, and commission_base (subtotal|final_total)
- [x] **AC-US2-04**: Given a reseller coupon is created, then it has a maturity_days field defaulting to 30 that determines the commission waiting period after delivery
- [x] **AC-US2-05**: Given a reseller coupon, then it follows all existing coupon validation rules (expiry, usage limits, min purchase) from increment 0004

---

## Implementation

**Increment**: [0005-reseller-system](../../../../../increments/0005-reseller-system/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-004**: Reseller Coupon Proposal Endpoint
- [x] **T-005**: Admin Reseller Coupon Approval
- [x] **T-006**: Reseller Deactivation Cascades to Coupons
