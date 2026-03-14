---
id: US-002
feature: FS-008
title: "Connect TikTok Shop via OAuth (P1)"
status: completed
priority: P1
created: 2026-03-12T00:00:00.000Z
tldr: "**As an** admin."
project: shopvui
---

# US-002: Connect TikTok Shop via OAuth (P1)

**Feature**: [FS-008](./FEATURE.md)

**As an** admin
**I want** to connect my TikTok Shop to ShopVui through an OAuth authorization flow
**So that** ShopVui can access my TikTok Shop orders automatically

---

## Acceptance Criteria

- [x] **AC-US2-01**: Given the admin navigates to Channel Settings, when they click "Connect TikTok Shop", then they are redirected to TikTok's OAuth consent page with correct app_key and redirect parameters
- [x] **AC-US2-02**: Given the admin grants permission on TikTok, when TikTok redirects back with an auth code, then the system exchanges it for access_token and refresh_token and stores them encrypted
- [x] **AC-US2-03**: Given valid TikTok credentials are stored, when the access_token expires, then the system automatically refreshes it using the refresh_token
- [x] **AC-US2-04**: Given a connected TikTok shop, when the admin clicks "Disconnect", then credentials are deleted and sync stops

---

## Implementation

**Increment**: [0008-channel-api-sync](../../../../../increments/0008-channel-api-sync/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-014**: TikTokAdapter - OAuth Flow (URL Generation and Code Exchange)
- [x] **T-015**: TikTokAdapter - Token Refresh and fetchOrders with Rate-Limit Handling
