---
id: FS-008
title: "Channel API Sync - Shopee & TikTok Shop"
type: feature
status: completed
priority: P1
created: 2026-03-12T00:00:00.000Z
lastUpdated: 2026-03-12
tldr: "ShopVui aggregates orders from multiple sales channels, but only website orders flow in real-time via the internal database."
complexity: high
stakeholder_relevant: true
---

# Channel API Sync - Shopee & TikTok Shop

## TL;DR

**What**: ShopVui aggregates orders from multiple sales channels, but only website orders flow in real-time via the internal database.
**Status**: completed | **Priority**: P1
**User Stories**: 9

![Channel API Sync - Shopee & TikTok Shop illustration](assets/feature-fs-008.jpg)

## Overview

ShopVui aggregates orders from multiple sales channels, but only website orders flow in real-time via the internal database. Shopee and TikTok Shop orders require manual CSV import, causing delays of hours or days before staff see new orders. This creates fulfillment lag, inventory mismatches, and extra manual work for operators managing 50-200+ orders/day across channels.

## Implementation History

| Increment | Status | Completion Date |
|-----------|--------|----------------|
| [0008-channel-api-sync](../../../../../increments/0008-channel-api-sync/spec.md) | ✅ completed | 2026-03-12T00:00:00.000Z |

## User Stories

- [US-001: Connect Shopee Shop via OAuth (P1)](./us-001-connect-shopee-shop-via-oauth-p1.md)
- [US-002: Connect TikTok Shop via OAuth (P1)](./us-002-connect-tiktok-shop-via-oauth-p1.md)
- [US-003: Automated Order Sync from Shopee (P1)](./us-003-automated-order-sync-from-shopee-p1.md)
- [US-004: Automated Order Sync from TikTok Shop (P1)](./us-004-automated-order-sync-from-tiktok-shop-p1.md)
- [US-005: Order Status Mapping (P1)](./us-005-order-status-mapping-p1.md)
- [US-006: Channel Credentials Security (P1)](./us-006-channel-credentials-security-p1.md)
- [US-007: Admin Channel Management UI (P2)](./us-007-admin-channel-management-ui-p2.md)
- [US-008: Sync Logs and Monitoring (P2)](./us-008-sync-logs-and-monitoring-p2.md)
- [US-009: Background Job Infrastructure (P1)](./us-009-background-job-infrastructure-p1.md)
