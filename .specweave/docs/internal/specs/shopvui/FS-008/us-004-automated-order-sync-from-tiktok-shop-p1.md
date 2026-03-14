---
id: US-004
feature: FS-008
title: "Automated Order Sync from TikTok Shop (P1)"
status: completed
priority: P1
created: 2026-03-12T00:00:00.000Z
tldr: "**As an** admin."
project: shopvui
---

# US-004: Automated Order Sync from TikTok Shop (P1)

**Feature**: [FS-008](./FEATURE.md)

**As an** admin
**I want** TikTok Shop orders to sync automatically every 5-15 minutes
**So that** new orders appear in ShopVui without manual import

---

## Acceptance Criteria

- [x] **AC-US4-01**: Given a connected TikTok shop with sync enabled, when the sync interval elapses, then the system fetches orders updated since the last successful sync from TikTok API
- [x] **AC-US4-02**: Given TikTok returns new orders, when they are processed, then each order is created with channel='tiktok', channelOrderId set to the TikTok order ID, and all fields mapped
- [x] **AC-US4-03**: Given a TikTok order already exists in ShopVui, when the sync runs, then the existing order is updated rather than duplicated
- [x] **AC-US4-04**: Given TikTok API returns a rate-limit error, when encountered, then exponential backoff retry applies and the event is logged

---

## Implementation

**Increment**: [0008-channel-api-sync](../../../../../increments/0008-channel-api-sync/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-016**: OrderMapper - TikTok Order to ShopVui Order
- [x] **T-017**: SyncExecutor Integration - TikTok End-to-End Sync
