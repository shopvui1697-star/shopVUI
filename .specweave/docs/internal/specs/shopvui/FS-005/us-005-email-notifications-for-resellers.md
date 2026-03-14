---
id: US-005
feature: FS-005
title: "Email Notifications for Resellers"
status: completed
priority: P1
created: 2026-03-11T00:00:00.000Z
tldr: "**As a** reseller."
project: shopvui
---

# US-005: Email Notifications for Resellers

**Feature**: [FS-005](./FEATURE.md)

**As a** reseller
**I want** to receive email notifications at key events
**So that** I stay informed about orders and commissions tied to my coupon

---

## Acceptance Criteria

- [x] **AC-US5-01**: Given a new order is placed with my reseller coupon, then I receive an email with order ID, product names, order total, estimated commission, and customer city
- [x] **AC-US5-02**: Given an order linked to my coupon is marked "delivered", then I receive an email confirming delivery and that the 30-day maturity countdown has started
- [x] **AC-US5-03**: Given a commission transitions to "approved", then I receive an email confirming the commission amount is ready for payout
- [x] **AC-US5-04**: Given an admin processes my commission payout, then I receive an email with payment amount and payment method
- [x] **AC-US5-05**: Given an order linked to my coupon is cancelled or returned within the maturity period, then I receive an email stating the commission has been voided with the reason

---

## Implementation

**Increment**: [0005-reseller-system](../../../../../increments/0005-reseller-system/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-013**: EmailModule Setup - Nodemailer and Handlebars Templates
- [x] **T-014**: Email Integration at All Lifecycle Events
