---
id: US-002
feature: FS-006
title: "Unified Order List with Channel Filtering"
status: completed
priority: P0
created: 2026-03-11T00:00:00.000Z
tldr: "**As an** admin."
project: shopvui
---

# US-002: Unified Order List with Channel Filtering

**Feature**: [FS-006](./FEATURE.md)

**As an** admin
**I want** to see all orders from all channels in a single list with filtering
**So that** I can manage fulfillment without switching between platforms

---

## Acceptance Criteria

- [x] **AC-US2-01**: Given orders exist from multiple channels, when the admin views the order list, then all orders appear sorted by creation date (newest first)
- [x] **AC-US2-02**: Given the order list, when the admin filters by channel (website, shopee, tiktok, facebook, other), then only orders from that channel are shown
- [x] **AC-US2-03**: Given the order list, when the admin filters by status, date range, or payment status, then results update accordingly
- [x] **AC-US2-04**: Given the order list, when the admin searches by order ID, customer name, or phone, then matching orders are returned
- [x] **AC-US2-05**: Given the order list, when the admin selects bulk actions, then they can mark shipped, export CSV, or print invoices for selected orders

---

## Implementation

**Increment**: [0006-admin-dashboard](../../../../../increments/0006-admin-dashboard/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-005**: Admin Orders API -- List, Filter, Search
- [x] **T-006**: Admin Orders API -- Bulk Actions and Order Detail
- [x] **T-007**: Admin Orders UI
