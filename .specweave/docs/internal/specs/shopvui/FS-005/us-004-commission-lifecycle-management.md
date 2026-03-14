---
id: US-004
feature: FS-005
title: "Commission Lifecycle Management"
status: completed
priority: P1
created: 2026-03-11T00:00:00.000Z
tldr: "**As a** system."
project: shopvui
---

# US-004: Commission Lifecycle Management

**Feature**: [FS-005](./FEATURE.md)

**As a** system
**I want** to track commissions through their full lifecycle
**So that** resellers are paid accurately and only for completed orders

---

## Acceptance Criteria

- [x] **AC-US4-01**: Given a commission with status "pending" and the order status changes to "delivered", when the delivery is confirmed, then the commission status changes to "maturing" with orderDeliveredAt set and maturityDate calculated as deliveredAt + maturity_days
- [x] **AC-US4-02**: Given a commission with status "maturing" and maturityDate has passed with no return or cancellation, when the maturity check runs, then the commission status changes to "approved" with approvedAt set
- [x] **AC-US4-03**: Given a commission with status "pending" or "maturing" and the order is cancelled or returned, when the cancellation/return is processed, then the commission status changes to "voided" with voidedAt and voidReason set
- [x] **AC-US4-04**: Given a commission with status "approved", when an admin processes the payout, then the commission status changes to "paid" with paidAt set
- [x] **AC-US4-05**: Given the Commission model, then it stores id, orderId, resellerId, couponCode, orderTotal, commissionAmount, status (pending|maturing|approved|paid|voided), orderDeliveredAt, maturityDate, approvedAt, paidAt, voidedAt, voidReason, createdAt

---

## Implementation

**Increment**: [0005-reseller-system](../../../../../increments/0005-reseller-system/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-010**: Commission Service - Full Lifecycle Transitions
- [x] **T-011**: Commission Maturity Cron Job
- [x] **T-012**: Admin Payout Processing
