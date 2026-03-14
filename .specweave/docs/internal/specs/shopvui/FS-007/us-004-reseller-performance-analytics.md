---
id: US-004
feature: FS-007
title: "Reseller Performance Analytics"
status: completed
priority: P1
created: 2026-03-12T00:00:00.000Z
tldr: "**As an** admin."
project: shopvui
---

# US-004: Reseller Performance Analytics

**Feature**: [FS-007](./FEATURE.md)

**As an** admin
**I want** to view reseller performance metrics including revenue, commissions, and conversion rates
**So that** I can evaluate and optimize the reseller program

---

## Acceptance Criteria

- [x] **AC-US4-01**: Given the admin analytics page, when the admin navigates to the reseller performance section, then a table shows each active reseller with total revenue generated, commission cost, and order count
- [x] **AC-US4-02**: Given the reseller performance section, when data loads, then top-performing resellers are ranked by revenue with a visual indicator (chart or ranked list)
- [x] **AC-US4-03**: Given the reseller performance section, when the admin views conversion rates, then the ratio of orders attributed to reseller coupons vs total orders is displayed for a selected time period
- [x] **AC-US4-04**: Given the reseller performance section, when the admin selects a date range, then all metrics recalculate for the selected period
- [x] **AC-US4-05**: Given the reseller performance section, when the admin views summary metrics, then total commission paid, total reseller-driven revenue, and average commission rate are displayed

---

## Implementation

**Increment**: [0007-feature-enhancements](../../../../../increments/0007-feature-enhancements/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-011**: Add reseller performance analytics endpoint
- [x] **T-012**: Build reseller performance table component (admin analytics)
- [x] **T-013**: [P] Reseller analytics integration test with seeded data
