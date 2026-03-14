---
id: US-005
feature: FS-012
title: "Database Performance Indexes (P1)"
status: completed
priority: P0
created: 2026-03-13T00:00:00.000Z
tldr: "**As a** platform operator."
project: shopvui
---

# US-005: Database Performance Indexes (P1)

**Feature**: [FS-012](./FEATURE.md)

**As a** platform operator
**I want** database indexes on frequently-queried foreign keys and filter columns
**So that** read-heavy queries on orders, commissions, cart items, and products perform well under production load

---

## Acceptance Criteria

- [x] **AC-US5-01**: Given the Prisma schema is updated, when indexes are added for Order (userId, status, createdAt, resellerId, orderNumber), Commission (resellerId, status), CouponUsage (couponId, userId), CartItem (cartId, productId), OrderItem (orderId, productId), and Product (categoryId, isActive), then the schema is valid and prisma validate passes
- [x] **AC-US5-02**: Given the index definitions are in the schema, when prisma migrate dev is run, then a new migration is created and applied successfully without data loss
- [x] **AC-US5-03**: Given the migration is applied, when querying orders by userId+status or products by categoryId+isActive, then the database query planner uses the new indexes

---

## Implementation

**Increment**: [0012-production-hardening](../../../../../increments/0012-production-hardening/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-010**: Add performance indexes to Prisma schema and generate migration
