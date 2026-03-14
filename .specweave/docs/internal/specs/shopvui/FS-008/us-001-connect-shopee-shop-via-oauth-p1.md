---
id: US-001
feature: FS-008
title: "Connect Shopee Shop via OAuth (P1)"
status: completed
priority: P1
created: 2026-03-12T00:00:00.000Z
tldr: "**As an** admin."
project: shopvui
---

# US-001: Connect Shopee Shop via OAuth (P1)

**Feature**: [FS-008](./FEATURE.md)

**As an** admin
**I want** to connect my Shopee shop to ShopVui through an OAuth authorization flow
**So that** ShopVui can access my Shopee orders without me sharing raw API keys

---

## Acceptance Criteria

- [x] **AC-US1-01**: Given the admin navigates to Channel Settings, when they click "Connect Shopee", then they are redirected to Shopee's OAuth consent page with correct app_key, redirect_uri, and state parameter
- [x] **AC-US1-02**: Given the admin grants permission on Shopee, when Shopee redirects back with an auth code, then the system exchanges it for access_token and refresh_token and stores them encrypted in the database
- [x] **AC-US1-03**: Given valid credentials are stored, when the access_token expires, then the system automatically refreshes it using the refresh_token before the next sync
- [x] **AC-US1-04**: Given an admin has multiple Shopee shops, when they connect a second shop, then both shops appear in Channel Settings and sync independently
- [x] **AC-US1-05**: Given a connected Shopee shop, when the admin clicks "Disconnect", then credentials are deleted and sync stops immediately

---

## Implementation

**Increment**: [0008-channel-api-sync](../../../../../increments/0008-channel-api-sync/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-006**: ShopeeAdapter - OAuth Flow (URL Generation and Code Exchange)
- [x] **T-007**: ShopeeAdapter - Token Refresh and fetchOrders with Rate-Limit Handling
- [x] **T-008**: OAuthController and OAuthService - Shopee OAuth Callback
