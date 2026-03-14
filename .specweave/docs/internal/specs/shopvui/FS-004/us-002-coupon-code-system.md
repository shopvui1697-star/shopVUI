---
id: US-002
feature: FS-004
title: "Coupon Code System"
status: completed
priority: P0
created: 2026-03-11T00:00:00.000Z
tldr: "**As a** customer."
project: shopvui
---

# US-002: Coupon Code System

**Feature**: [FS-004](./FEATURE.md)

**As a** customer
**I want** to apply coupon codes at checkout for discounts
**So that** I can save money on my purchases

---

## Acceptance Criteria

- [x] **AC-US2-01**: Given a percentage coupon (SAVE10, 10%, max discount 500,000), when applied to a 3,000,000 VND subtotal, then discount is 300,000 VND
- [x] **AC-US2-02**: Given a percentage coupon (SAVE50, 50%, max discount 500,000), when applied to a 3,000,000 VND subtotal, then discount is capped at 500,000 VND
- [x] **AC-US2-03**: Given a fixed-amount coupon (FLAT200K, 200,000), when applied, then exactly 200,000 VND is subtracted from subtotal
- [x] **AC-US2-04**: Given a free-shipping coupon (FREESHIP), when applied, then shipping fee becomes 0 VND
- [x] **AC-US2-05**: Given a buy-X-get-Y coupon (BUY2GET1, buy 2 get 1 free), when cart has 3+ of the applicable product, then the cheapest qualifying item is free

---

## Implementation

**Increment**: [0004-ecommerce-flow](../../../../../increments/0004-ecommerce-flow/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-004**: CouponService - PERCENTAGE Coupon Calculation (with max_discount cap)
- [x] **T-005**: CouponService - FIXED and FREE_SHIPPING Coupon Calculation
- [x] **T-006**: CouponService - BUY_X_GET_Y Coupon Calculation
- [x] **T-007**: CouponModule - API Endpoints and Admin CRUD
- [x] **T-008**: PriceEngineService - applyCoupon Integration
