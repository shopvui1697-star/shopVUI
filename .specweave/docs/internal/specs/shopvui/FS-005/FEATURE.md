---
id: FS-005
title: "Reseller Affiliate Coupon System"
type: feature
status: completed
priority: P1
created: 2026-03-11T00:00:00.000Z
lastUpdated: 2026-03-11
tldr: "ShopVui has a coupon system (increment 0004) with reseller fields pre-wired in the Prisma schema (resellerId, commissionType, commissionValue, isResellerCoupon on Coupon; resellerId on Order), but no reseller logic exists."
complexity: high
stakeholder_relevant: true
---

# Reseller Affiliate Coupon System

## TL;DR

**What**: ShopVui has a coupon system (increment 0004) with reseller fields pre-wired in the Prisma schema (resellerId, commissionType, commissionValue, isResellerCoupon on Coupon; resellerId on Order), but no reseller logic exists.
**Status**: completed | **Priority**: P1
**User Stories**: 7

![Reseller Affiliate Coupon System illustration](assets/feature-fs-005.jpg)

## Overview

ShopVui has a coupon system (increment 0004) with reseller fields pre-wired in the Prisma schema (resellerId, commissionType, commissionValue, isResellerCoupon on Coupon; resellerId on Order), but no reseller logic exists. Affiliates, influencers, and partners have no way to register, manage coupon codes, track orders, or earn commissions. Without a reseller system, ShopVui misses an entire acquisition channel and revenue-sharing model.

## Implementation History

| Increment | Status | Completion Date |
|-----------|--------|----------------|
| [0005-reseller-system](../../../../../increments/0005-reseller-system/spec.md) | ✅ completed | 2026-03-11T00:00:00.000Z |

## User Stories

- [US-001: Reseller Registration and Onboarding](./us-001-reseller-registration-and-onboarding.md)
- [US-002: Reseller Coupon Creation and Approval](./us-002-reseller-coupon-creation-and-approval.md)
- [US-003: Order Flow with Reseller Coupon](./us-003-order-flow-with-reseller-coupon.md)
- [US-004: Commission Lifecycle Management](./us-004-commission-lifecycle-management.md)
- [US-005: Email Notifications for Resellers](./us-005-email-notifications-for-resellers.md)
- [US-006: Reseller Portal Dashboard](./us-006-reseller-portal-dashboard.md)
- [US-007: Admin Reseller Management](./us-007-admin-reseller-management.md)
