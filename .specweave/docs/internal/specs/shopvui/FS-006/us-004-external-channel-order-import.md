---
id: US-004
feature: FS-006
title: "External Channel Order Import"
status: completed
priority: P0
created: 2026-03-11T00:00:00.000Z
tldr: "**As an** admin."
project: shopvui
---

# US-004: External Channel Order Import

**Feature**: [FS-006](./FEATURE.md)

**As an** admin
**I want** to import orders from external channels via CSV upload
**So that** I can consolidate all sales data without waiting for API integrations

---

## Acceptance Criteria

- [x] **AC-US4-01**: Given a CSV file with order data, when the admin uploads it with a channel selection (shopee, tiktok, facebook, other), then orders are created in the database with the correct channel value
- [x] **AC-US4-02**: Given a CSV upload, when the file contains invalid rows, then a summary report shows which rows failed and why, while valid rows are imported
- [x] **AC-US4-03**: Given future API sync needs, when the import module is built, then stub service interfaces exist for Shopee Open Platform API and TikTok Shop Seller API
- [x] **AC-US4-04**: Given a duplicate external order ID for the same channel, when importing, then the duplicate is skipped and reported

---

## Implementation

**Increment**: [0006-admin-dashboard](../../../../../increments/0006-admin-dashboard/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-008**: CSV Import API -- Streaming Parser and Deduplication
- [x] **T-009**: Channel API Stubs (Shopee and TikTok)
- [x] **T-010**: CSV Import UI
