---
id: US-006
feature: FS-005
title: "Reseller Portal Dashboard"
status: completed
priority: P1
created: 2026-03-11T00:00:00.000Z
tldr: "**As an** active reseller."
project: shopvui
---

# US-006: Reseller Portal Dashboard

**Feature**: [FS-005](./FEATURE.md)

**As an** active reseller
**I want** a self-service portal with real-time statistics
**So that** I can track my performance and manage my account

---

## Acceptance Criteria

- [x] **AC-US6-01**: Given I am logged in as an active reseller at /reseller/dashboard, then I see summary cards showing total orders, total revenue generated, total commission earned, and total commission paid
- [x] **AC-US6-02**: Given I navigate to the orders tab, then I see a list of all orders placed using my coupon code(s) with order ID, date, total, and commission status
- [x] **AC-US6-03**: Given I navigate to the commissions tab, then I see all commissions with filterable statuses (pending, maturing, approved, paid, voided) showing amounts, dates, and maturity countdown for "maturing" entries
- [x] **AC-US6-04**: Given I navigate to the payout history tab, then I see all paid commissions with payment date, amount, and method
- [x] **AC-US6-05**: Given I navigate to profile settings, then I can update my bank/payment details (bankInfo JSON), phone, and social profiles
- [x] **AC-US6-06**: Given I view my coupon section, then I see my active coupon code(s), their discount values, and can generate a shareable link with the coupon pre-applied (e.g., shopvui.com?coupon=ANNA10)

---

## Implementation

**Increment**: [0005-reseller-system](../../../../../increments/0005-reseller-system/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-015**: Reseller Portal - Layout, Registration, and Login Pages
- [x] **T-016**: Reseller Portal - Dashboard, Orders, Commissions, and Payouts Pages
- [x] **T-017**: Reseller Portal - Profile Settings and Coupon Shareable Links
