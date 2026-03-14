---
id: US-005
feature: FS-007
title: "Shareable Coupon Links for Resellers"
status: completed
priority: P1
created: 2026-03-12T00:00:00.000Z
tldr: "**As a** reseller."
project: shopvui
---

# US-005: Shareable Coupon Links for Resellers

**Feature**: [FS-007](./FEATURE.md)

**As a** reseller
**I want** to generate shareable links that pre-apply my coupon code
**So that** I can share them on social media and customers automatically get my discount at checkout

---

## Acceptance Criteria

- [x] **AC-US5-01**: Given the reseller portal, when a reseller views their active coupons, then each coupon shows a "Copy Link" button that copies a URL in the format `{site}?coupon={CODE}` to the clipboard
- [x] **AC-US5-02**: Given a customer visiting the site via a URL with `?coupon=CODE` query parameter, when they add items to cart and reach checkout, then the coupon code is pre-filled in the coupon input field
- [x] **AC-US5-03**: Given a pre-applied coupon from a URL parameter, when the coupon is valid, then the discount is reflected in the order summary automatically
- [x] **AC-US5-04**: Given a pre-applied coupon from a URL parameter, when the coupon is invalid or expired, then a message informs the customer and checkout proceeds without the discount
- [x] **AC-US5-05**: Given the reseller portal shareable link section, when the reseller views their links, then click count or usage count for each link is displayed if tracking data is available

---

## Implementation

**Increment**: [0007-feature-enhancements](../../../../../increments/0007-feature-enhancements/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-014**: Add Copy Link button to reseller coupon page
- [x] **T-015**: Implement useCouponFromUrl hook (customer web)
- [x] **T-016**: Pre-fill coupon on checkout from sessionStorage
