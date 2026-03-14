---
increment: 0008-channel-api-sync
title: Channel API Sync - Shopee & TikTok Shop
status: completed
priority: P1
type: feature
created: 2026-03-12T00:00:00.000Z
structure: user-stories
test_mode: TDD
coverage_target: 80
---

# Channel API Sync - Shopee & TikTok Shop

## Problem Statement

ShopVui aggregates orders from multiple sales channels, but only website orders flow in real-time via the internal database. Shopee and TikTok Shop orders require manual CSV import, causing delays of hours or days before staff see new orders. This creates fulfillment lag, inventory mismatches, and extra manual work for operators managing 50-200+ orders/day across channels.

## Goals

- Automate order ingestion from Shopee Open Platform API and TikTok Shop Seller API
- Provide OAuth2 connection flows so admins can link shops without developer intervention
- Run background sync jobs at configurable intervals (5-15 min) with retry and rate-limit handling
- Map external order data to the unified ShopVui Order model preserving all customer, item, and pricing fields
- Give admins visibility into sync status, logs, and manual trigger controls

## Out of Scope

- Facebook Commerce API integration (future increment)
- Webhook/push-based real-time sync (enhancement beyond polling, future increment)
- Inventory sync back to Shopee/TikTok (write-back, future increment)
- Order status updates pushed back to external channels
- Storefront customer-facing changes

## Dependencies

- Increment 0004 (E-Commerce Flow) -- Order model with `channel` enum and `channelOrderId`
- Increment 0006 (Admin Dashboard) -- Admin UI and AdminGuard auth
- Existing CSV import pattern at `apps/api/src/admin/imports/` for reference

## User Stories

### US-001: Connect Shopee Shop via OAuth (P1)
**Project**: shopvui
**As an** admin
**I want** to connect my Shopee shop to ShopVui through an OAuth authorization flow
**So that** ShopVui can access my Shopee orders without me sharing raw API keys

**Acceptance Criteria**:
- [x] **AC-US1-01**: Given the admin navigates to Channel Settings, when they click "Connect Shopee", then they are redirected to Shopee's OAuth consent page with correct app_key, redirect_uri, and state parameter
- [x] **AC-US1-02**: Given the admin grants permission on Shopee, when Shopee redirects back with an auth code, then the system exchanges it for access_token and refresh_token and stores them encrypted in the database
- [x] **AC-US1-03**: Given valid credentials are stored, when the access_token expires, then the system automatically refreshes it using the refresh_token before the next sync
- [x] **AC-US1-04**: Given an admin has multiple Shopee shops, when they connect a second shop, then both shops appear in Channel Settings and sync independently
- [x] **AC-US1-05**: Given a connected Shopee shop, when the admin clicks "Disconnect", then credentials are deleted and sync stops immediately

---

### US-002: Connect TikTok Shop via OAuth (P1)
**Project**: shopvui
**As an** admin
**I want** to connect my TikTok Shop to ShopVui through an OAuth authorization flow
**So that** ShopVui can access my TikTok Shop orders automatically

**Acceptance Criteria**:
- [x] **AC-US2-01**: Given the admin navigates to Channel Settings, when they click "Connect TikTok Shop", then they are redirected to TikTok's OAuth consent page with correct app_key and redirect parameters
- [x] **AC-US2-02**: Given the admin grants permission on TikTok, when TikTok redirects back with an auth code, then the system exchanges it for access_token and refresh_token and stores them encrypted
- [x] **AC-US2-03**: Given valid TikTok credentials are stored, when the access_token expires, then the system automatically refreshes it using the refresh_token
- [x] **AC-US2-04**: Given a connected TikTok shop, when the admin clicks "Disconnect", then credentials are deleted and sync stops

---

### US-003: Automated Order Sync from Shopee (P1)
**Project**: shopvui
**As an** admin
**I want** Shopee orders to sync automatically every 5-15 minutes
**So that** new orders appear in ShopVui without manual CSV import

**Acceptance Criteria**:
- [x] **AC-US3-01**: Given a connected Shopee shop with sync enabled, when the sync interval elapses, then the system fetches orders updated since the last successful sync timestamp from Shopee API
- [x] **AC-US3-02**: Given Shopee returns new orders, when they are processed, then each order is created in the database with channel='shopee', channelOrderId set to the Shopee order SN, and all item/customer/pricing fields mapped
- [x] **AC-US3-03**: Given a Shopee order already exists in ShopVui (matching channelOrderId), when the sync runs, then the existing order is updated with the latest status and fields rather than duplicated
- [x] **AC-US3-04**: Given Shopee API returns a rate-limit error (HTTP 429 or error code), when the sync encounters it, then it backs off with exponential retry (1s, 2s, 4s, max 3 retries) and logs the rate-limit event
- [x] **AC-US3-05**: Given the sync interval is configurable, when the admin sets it to 10 minutes in Channel Settings, then the background job runs every 10 minutes for that shop

---

### US-004: Automated Order Sync from TikTok Shop (P1)
**Project**: shopvui
**As an** admin
**I want** TikTok Shop orders to sync automatically every 5-15 minutes
**So that** new orders appear in ShopVui without manual import

**Acceptance Criteria**:
- [x] **AC-US4-01**: Given a connected TikTok shop with sync enabled, when the sync interval elapses, then the system fetches orders updated since the last successful sync from TikTok API
- [x] **AC-US4-02**: Given TikTok returns new orders, when they are processed, then each order is created with channel='tiktok', channelOrderId set to the TikTok order ID, and all fields mapped
- [x] **AC-US4-03**: Given a TikTok order already exists in ShopVui, when the sync runs, then the existing order is updated rather than duplicated
- [x] **AC-US4-04**: Given TikTok API returns a rate-limit error, when encountered, then exponential backoff retry applies and the event is logged

---

### US-005: Order Status Mapping (P1)
**Project**: shopvui
**As a** system
**I want** to map Shopee and TikTok order statuses to ShopVui's unified status enum
**So that** orders from all channels have consistent status representation

**Acceptance Criteria**:
- [x] **AC-US5-01**: Given a Shopee order with status UNPAID, when mapped, then ShopVui order status is PENDING and paymentStatus is UNPAID
- [x] **AC-US5-02**: Given a Shopee order with status READY_TO_SHIP, when mapped, then ShopVui order status is CONFIRMED
- [x] **AC-US5-03**: Given a Shopee order with status SHIPPED, when mapped, then ShopVui order status is SHIPPING
- [x] **AC-US5-04**: Given a Shopee order with status COMPLETED, when mapped, then ShopVui order status is DELIVERED
- [x] **AC-US5-05**: Given a Shopee order with status CANCELLED, when mapped, then ShopVui order status is CANCELLED
- [x] **AC-US5-06**: Given a TikTok order with status AWAITING_PAYMENT, when mapped, then ShopVui status is PENDING
- [x] **AC-US5-07**: Given a TikTok order with status AWAITING_SHIPMENT, when mapped, then ShopVui status is CONFIRMED
- [x] **AC-US5-08**: Given a TikTok order with status SHIPPED or IN_TRANSIT, when mapped, then ShopVui status is SHIPPING
- [x] **AC-US5-09**: Given a TikTok order with status DELIVERED, when mapped, then ShopVui status is DELIVERED
- [x] **AC-US5-10**: Given a TikTok order with status CANCELLED, when mapped, then ShopVui status is CANCELLED
- [x] **AC-US5-11**: Given an unrecognized status from either platform, when mapped, then the order is created with status PENDING and a warning is logged

---

### US-006: Channel Credentials Security (P1)
**Project**: shopvui
**As a** system
**I want** to store channel API credentials encrypted at rest
**So that** shop access tokens are protected if the database is compromised

**Acceptance Criteria**:
- [x] **AC-US6-01**: Given a ChannelConnection record, then access_token and refresh_token fields are encrypted using AES-256 before database storage
- [x] **AC-US6-02**: Given the encryption key is stored as an environment variable (CHANNEL_ENCRYPTION_KEY), then it is never logged or exposed in API responses
- [x] **AC-US6-03**: Given an admin views Channel Settings, then token values are never sent to the frontend -- only connection status (connected/disconnected) and shop name

---

### US-007: Admin Channel Management UI (P2)
**Project**: shopvui
**As an** admin
**I want** a Channel Settings page to manage connected shops and sync settings
**So that** I can connect, configure, and monitor all channel integrations in one place

**Acceptance Criteria**:
- [x] **AC-US7-01**: Given the admin navigates to /admin/channels, then they see a list of supported channels (Shopee, TikTok Shop) with connection status for each
- [x] **AC-US7-02**: Given a connected channel, then the UI shows: shop name, last sync time, sync status (success/failed/running), and orders synced count
- [x] **AC-US7-03**: Given a connected channel, when the admin clicks "Sync Now", then a manual sync is triggered immediately and the UI shows a loading indicator until complete
- [x] **AC-US7-04**: Given a connected channel, when the admin toggles the sync enabled/disabled switch, then auto-sync starts or stops accordingly
- [x] **AC-US7-05**: Given a connected channel, when the admin changes the sync interval dropdown (5/10/15 min), then the setting is saved and applied to the next sync cycle

---

### US-008: Sync Logs and Monitoring (P2)
**Project**: shopvui
**As an** admin
**I want** to view sync history and error logs
**So that** I can diagnose sync failures and verify orders are flowing correctly

**Acceptance Criteria**:
- [x] **AC-US8-01**: Given a connected channel, when the admin clicks "View Logs", then they see a paginated list of sync events with: timestamp, status (success/failed), orders fetched, orders created/updated, duration, and error message (if failed)
- [x] **AC-US8-02**: Given a sync failure, then the log entry includes the error type (rate_limit, auth_expired, network_error, mapping_error) and a human-readable description
- [x] **AC-US8-03**: Given sync logs older than 30 days, then they are automatically cleaned up by a scheduled job

---

### US-009: Background Job Infrastructure (P1)
**Project**: shopvui
**As a** system
**I want** a cron-based job scheduler for channel sync tasks
**So that** sync jobs run reliably at configured intervals with proper error handling

**Acceptance Criteria**:
- [x] **AC-US9-01**: Given the NestJS application starts, then cron jobs are registered for each enabled channel connection based on their configured interval
- [x] **AC-US9-02**: Given a sync job fails, then it retries up to 3 times with exponential backoff (1s, 2s, 4s) before marking the sync as failed
- [x] **AC-US9-03**: Given a sync job is already running for a shop, when the next interval triggers, then the new run is skipped to prevent concurrent syncs for the same shop
- [x] **AC-US9-04**: Given an admin triggers "Sync Now", then the manual sync runs immediately regardless of the cron schedule (but still respects the concurrency guard)

## Functional Requirements

### FR-001: ChannelConnection Database Model
New Prisma model storing: id, channel (shopee/tiktok), shopId (external), shopName, encryptedAccessToken, encryptedRefreshToken, tokenExpiresAt, syncEnabled, syncIntervalMinutes (default 10), lastSyncAt, lastSyncStatus, createdById (admin user), createdAt, updatedAt.

### FR-002: SyncLog Database Model
New Prisma model storing: id, channelConnectionId, startedAt, completedAt, status (success/failed/running), ordersFetched, ordersCreated, ordersUpdated, errorType, errorMessage, durationMs.

### FR-003: Channel API Abstraction
A ChannelSyncService interface with implementations for Shopee and TikTok, enabling addition of new channels without modifying core sync logic. Methods: authorize(), refreshToken(), fetchOrders(since), mapOrder(externalOrder).

### FR-004: Rate Limit Handling
Each channel adapter tracks API quota usage and delays requests when approaching limits. Shopee: ~1 req/sec, 10,000/day. TikTok: similar per-app limits.

## Success Criteria

- Shopee and TikTok orders appear in ShopVui within 15 minutes of placement on external platform
- Zero duplicate orders across syncs (channelOrderId uniqueness enforced)
- Admin can connect a new shop in under 2 minutes via OAuth flow
- Sync failure rate below 5% (excluding upstream API outages)
- All credentials encrypted at rest with no token leakage in logs or API responses
