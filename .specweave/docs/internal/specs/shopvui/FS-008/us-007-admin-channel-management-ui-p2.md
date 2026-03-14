---
id: US-007
feature: FS-008
title: "Admin Channel Management UI (P2)"
status: completed
priority: P1
created: 2026-03-12T00:00:00.000Z
tldr: "**As an** admin."
project: shopvui
---

# US-007: Admin Channel Management UI (P2)

**Feature**: [FS-008](./FEATURE.md)

**As an** admin
**I want** a Channel Settings page to manage connected shops and sync settings
**So that** I can connect, configure, and monitor all channel integrations in one place

---

## Acceptance Criteria

- [x] **AC-US7-01**: Given the admin navigates to /admin/channels, then they see a list of supported channels (Shopee, TikTok Shop) with connection status for each
- [x] **AC-US7-02**: Given a connected channel, then the UI shows: shop name, last sync time, sync status (success/failed/running), and orders synced count
- [x] **AC-US7-03**: Given a connected channel, when the admin clicks "Sync Now", then a manual sync is triggered immediately and the UI shows a loading indicator until complete
- [x] **AC-US7-04**: Given a connected channel, when the admin toggles the sync enabled/disabled switch, then auto-sync starts or stops accordingly
- [x] **AC-US7-05**: Given a connected channel, when the admin changes the sync interval dropdown (5/10/15 min), then the setting is saved and applied to the next sync cycle

---

## Implementation

**Increment**: [0008-channel-api-sync](../../../../../increments/0008-channel-api-sync/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-018**: Admin API - GET /admin/channels and GET /admin/channels/:id/logs
- [x] **T-019**: Channel Settings Page - /admin/channels List View
- [x] **T-020**: Sync Logs View and Connect OAuth Flow
