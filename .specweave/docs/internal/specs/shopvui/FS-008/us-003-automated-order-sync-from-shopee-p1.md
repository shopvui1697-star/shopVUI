---
id: US-003
feature: FS-008
title: "Automated Order Sync from Shopee (P1)"
status: completed
priority: P1
created: 2026-03-12T00:00:00.000Z
tldr: "**As an** admin."
project: shopvui
---

# US-003: Automated Order Sync from Shopee (P1)

**Feature**: [FS-008](./FEATURE.md)

**As an** admin
**I want** Shopee orders to sync automatically every 5-15 minutes
**So that** new orders appear in ShopVui without manual CSV import

---

## Acceptance Criteria

- [x] **AC-US3-01**: Given a connected Shopee shop with sync enabled, when the sync interval elapses, then the system fetches orders updated since the last successful sync timestamp from Shopee API
- [x] **AC-US3-02**: Given Shopee returns new orders, when they are processed, then each order is created in the database with channel='shopee', channelOrderId set to the Shopee order SN, and all item/customer/pricing fields mapped
- [x] **AC-US3-03**: Given a Shopee order already exists in ShopVui (matching channelOrderId), when the sync runs, then the existing order is updated with the latest status and fields rather than duplicated
- [x] **AC-US3-04**: Given Shopee API returns a rate-limit error (HTTP 429 or error code), when the sync encounters it, then it backs off with exponential retry (1s, 2s, 4s, max 3 retries) and logs the rate-limit event
- [x] **AC-US3-05**: Given the sync interval is configurable, when the admin sets it to 10 minutes in Channel Settings, then the background job runs every 10 minutes for that shop

---

## Implementation

**Increment**: [0008-channel-api-sync](../../../../../increments/0008-channel-api-sync/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-009**: OrderMapper - Shopee Order to ShopVui Order
- [x] **T-010**: SyncExecutor Order Upsert - Create New / Update Existing
- [x] **T-011**: AdminChannelsController - Manual Sync Trigger and Settings Update
