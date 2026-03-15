---
id: FS-015
title: "In-App Notification Inbox System"
type: feature
status: completed
priority: P1
created: 2026-03-14T00:00:00.000Z
lastUpdated: 2026-03-15
tldr: "ShopVui currently has no in-app notification mechanism."
complexity: high
stakeholder_relevant: true
---

# In-App Notification Inbox System

## TL;DR

**What**: ShopVui currently has no in-app notification mechanism.
**Status**: completed | **Priority**: P1
**User Stories**: 8

![In-App Notification Inbox System illustration](assets/feature-fs-015.jpg)

## Overview

ShopVui currently has no in-app notification mechanism. Users (customers, admins, resellers) only receive email notifications via Nodemailer. This means users must leave the app to check updates about orders, commissions, and system alerts. An in-app inbox reduces friction and increases engagement by surfacing relevant events directly in the UI.

## Implementation History

| Increment | Status | Completion Date |
|-----------|--------|----------------|
| [0015-inbox-system](../../../../../increments/0015-inbox-system/spec.md) | ✅ completed | 2026-03-14T00:00:00.000Z |

## User Stories

- [US-001: Notification Data Model (P0)](./us-001-notification-data-model-p0.md)
- [US-002: Customer Notification API (P0)](./us-002-customer-notification-api-p0.md)
- [US-003: Admin Notification API (P0)](./us-003-admin-notification-api-p0.md)
- [US-004: Shared NotificationService (P0)](./us-004-shared-notificationservice-p0.md)
- [US-005: Shared TypeScript Types (P1)](./us-005-shared-typescript-types-p1.md)
- [US-006: Web App Notification Bell (P1)](./us-006-web-app-notification-bell-p1.md)
- [US-007: Web App Inbox Page (P1)](./us-007-web-app-inbox-page-p1.md)
- [US-008: Admin App Notification Bell and Inbox (P1)](./us-008-admin-app-notification-bell-and-inbox-p1.md)
