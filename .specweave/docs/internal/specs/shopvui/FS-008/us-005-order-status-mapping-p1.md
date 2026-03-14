---
id: US-005
feature: FS-008
title: "Order Status Mapping (P1)"
status: completed
priority: P1
created: 2026-03-12T00:00:00.000Z
tldr: "**As a** system."
project: shopvui
---

# US-005: Order Status Mapping (P1)

**Feature**: [FS-008](./FEATURE.md)

**As a** system
**I want** to map Shopee and TikTok order statuses to ShopVui's unified status enum
**So that** orders from all channels have consistent status representation

---

## Acceptance Criteria

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

## Implementation

**Increment**: [0008-channel-api-sync](../../../../../increments/0008-channel-api-sync/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-012**: Shopee Status Mapping - All 5 Statuses + Unknown Fallback
- [x] **T-013**: TikTok Status Mapping - All 5 Statuses + IN_TRANSIT + Unknown Fallback
