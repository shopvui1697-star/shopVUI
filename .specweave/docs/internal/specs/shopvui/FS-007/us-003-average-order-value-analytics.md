---
id: US-003
feature: FS-007
title: "Average Order Value Analytics"
status: completed
priority: P1
created: 2026-03-12T00:00:00.000Z
tldr: "**As an** admin."
project: shopvui
---

# US-003: Average Order Value Analytics

**Feature**: [FS-007](./FEATURE.md)

**As an** admin
**I want** to view average order value broken down by sales channel with configurable time periods
**So that** I can identify which channels drive higher-value orders and optimize accordingly

---

## Acceptance Criteria

- [x] **AC-US3-01**: Given the admin analytics page, when the admin views the AOV section, then a chart displays average order value per channel (website, shopee, tiktok, facebook, other)
- [x] **AC-US3-02**: Given the AOV chart, when the admin selects daily, weekly, or monthly time period, then the chart data recalculates for the selected granularity
- [x] **AC-US3-03**: Given the AOV chart, when the admin selects a date range, then only orders within that range are included in the calculation
- [x] **AC-US3-04**: Given the AOV section, when data loads, then the overall AOV across all channels is displayed as a summary metric alongside the per-channel breakdown

---

## Implementation

**Increment**: [0007-feature-enhancements](../../../../../increments/0007-feature-enhancements/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-008**: Add AOV-by-channel analytics endpoint
- [x] **T-009**: Build AOV chart component (admin analytics page)
- [x] **T-010**: [P] AOV analytics integration test with seeded data
