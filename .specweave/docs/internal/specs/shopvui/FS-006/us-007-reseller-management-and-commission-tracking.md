---
id: US-007
feature: FS-006
title: "Reseller Management and Commission Tracking"
status: completed
priority: P0
created: 2026-03-11T00:00:00.000Z
tldr: "**As an** admin."
project: shopvui
---

# US-007: Reseller Management and Commission Tracking

**Feature**: [FS-006](./FEATURE.md)

**As an** admin
**I want** to manage resellers, set commission rates, and handle payouts
**So that** I can oversee the reseller program and ensure accurate compensation

---

## Acceptance Criteria

- [x] **AC-US7-01**: Given the reseller list, when the admin views it, then all resellers are shown with status (pending, approved, rejected, suspended), order count, and total revenue
- [x] **AC-US7-02**: Given a pending reseller application, when the admin approves or rejects it, then the reseller status updates and they are notified
- [x] **AC-US7-03**: Given a reseller, when the admin sets a commission rate, then it can be set per-reseller or fall back to a global default rate
- [x] **AC-US7-04**: Given commission records, when the admin views payout management, then they can filter by status (pending, approved, paid) and mark payouts as approved or paid
- [x] **AC-US7-05**: Given the reseller management page, when the admin exports commission reports, then a CSV with reseller name, orders, revenue, commission owed, and payout status is downloaded

---

## Implementation

**Increment**: [0006-admin-dashboard](../../../../../increments/0006-admin-dashboard/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-016**: Admin Resellers API -- List, Approval, Commission Rate
- [x] **T-017**: Admin Resellers API -- Payouts and CSV Export
- [x] **T-018**: Admin Resellers UI
