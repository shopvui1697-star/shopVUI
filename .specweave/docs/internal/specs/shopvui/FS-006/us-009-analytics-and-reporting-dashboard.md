---
id: US-009
feature: FS-006
title: "Analytics and Reporting Dashboard"
status: completed
priority: P0
created: 2026-03-11T00:00:00.000Z
tldr: "**As an** admin."
project: shopvui
---

# US-009: Analytics and Reporting Dashboard

**Feature**: [FS-006](./FEATURE.md)

**As an** admin
**I want** to view revenue, order, product, coupon, and reseller analytics
**So that** I can make data-driven business decisions

---

## Acceptance Criteria

- [x] **AC-US9-01**: Given the analytics page, when the admin views revenue by channel, then a pie/bar chart shows revenue breakdown for website, shopee, tiktok, facebook, and other
- [x] **AC-US9-02**: Given the analytics page, when the admin views revenue over time, then a line chart shows daily/weekly/monthly revenue with date range selection
- [x] **AC-US9-03**: Given the analytics page, when the admin views top selling products, then a ranked list with units sold and revenue is displayed
- [x] **AC-US9-04**: Given the analytics page, when the admin views order volume per channel, then a bar chart shows order counts by channel for the selected period
- [x] **AC-US9-05**: Given the analytics page, when the admin views coupon performance, then each coupon shows usage count, total discount given, and orders influenced

---

## Implementation

**Increment**: [0006-admin-dashboard](../../../../../increments/0006-admin-dashboard/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-021**: Admin Analytics API -- Revenue and Order Volume
- [x] **T-022**: Admin Analytics API -- Products and Coupons
- [x] **T-023**: Analytics Dashboard UI with Recharts
