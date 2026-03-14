---
id: US-003
feature: FS-004
title: "Coupon Validation Rules"
status: completed
priority: P0
created: 2026-03-11T00:00:00.000Z
tldr: "**As a** system."
project: shopvui
---

# US-003: Coupon Validation Rules

**Feature**: [FS-004](./FEATURE.md)

**As a** system
**I want** to enforce coupon constraints before applying discounts
**So that** coupons are only used within their intended rules

---

## Acceptance Criteria

- [x] **AC-US3-01**: Given a coupon with valid_until in the past, when a customer applies it, then it is rejected with message "Coupon has expired"
- [x] **AC-US3-02**: Given a coupon with usage_limit of 100 and 100 redemptions already recorded, when applied, then it is rejected with "Coupon usage limit reached"
- [x] **AC-US3-03**: Given a coupon with per_user_limit of 1 and the current user has already used it once, when applied again, then it is rejected with "You have already used this coupon"
- [x] **AC-US3-04**: Given a coupon restricted to category "Electronics" and the cart contains only "Clothing" items, then the coupon is rejected with "Coupon not applicable to items in cart"
- [x] **AC-US3-05**: Given a min_purchase coupon (BIG500K, requires 500,000 minimum), when subtotal is 400,000, then it is rejected with "Minimum purchase of 500,000 VND required"

---

## Implementation

**Increment**: [0004-ecommerce-flow](../../../../../increments/0004-ecommerce-flow/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-009**: CouponValidator - Expiry and Active Status Check
- [x] **T-010**: CouponValidator - Usage Limit Check (Global and Per-User)
- [x] **T-011**: CouponValidator - Minimum Purchase and Category Restriction
- [x] **T-012**: CouponValidator - Full Validation Chain Integration
- [x] **T-013**: POST /coupons/validate Endpoint Test
