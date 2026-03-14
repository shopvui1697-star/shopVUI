---
id: US-007
feature: FS-005
title: "Admin Reseller Management"
status: completed
priority: P1
created: 2026-03-11T00:00:00.000Z
tldr: "**As an** admin."
project: shopvui
---

# US-007: Admin Reseller Management

**Feature**: [FS-005](./FEATURE.md)

**As an** admin
**I want** to manage resellers, their coupons, and commission payouts
**So that** I maintain control over the affiliate program

---

## Acceptance Criteria

- [x] **AC-US7-01**: Given I am on the admin reseller page, then I see a list of all resellers with status, total orders, total revenue, and pending commission amount
- [x] **AC-US7-02**: Given I click on a reseller, then I see their full profile, linked coupons, order history, and commission breakdown by status
- [x] **AC-US7-03**: Given there are approved commissions, when I select commissions and click "Process Payout", then the selected commissions transition to "paid" and the reseller is notified via email
- [x] **AC-US7-04**: Given I want to deactivate a reseller, when I set their status to "inactive", then their linked coupons are also deactivated and cannot be used at checkout
- [x] **AC-US7-05**: Given I am creating/approving a reseller coupon, then I can set discount_type, discount_value, commission_type (percentage|fixed), commission_value, commission_base (subtotal|final_total), and maturity_days

---

## Implementation

**Increment**: [0005-reseller-system](../../../../../increments/0005-reseller-system/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-018**: Admin Reseller List and Detail Pages
- [x] **T-019**: Admin Coupon Approval Form
- [x] **T-020**: Admin Payout Processing and Reseller Deactivation UI
