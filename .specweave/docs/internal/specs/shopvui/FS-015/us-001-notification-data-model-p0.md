---
id: US-001
feature: FS-015
title: "Notification Data Model (P0)"
status: completed
priority: P1
created: 2026-03-14T00:00:00.000Z
tldr: "**As a** developer."
project: shopvui
---

# US-001: Notification Data Model (P0)

**Feature**: [FS-015](./FEATURE.md)

**As a** developer
**I want** a Notification database model with type enum, read status, and metadata
**So that** the system can persist and query notifications for any user

---

## Acceptance Criteria

- [x] **AC-US1-01**: Given the Prisma schema, when a migration runs, then a `Notification` table exists with columns: id, userId (FK to User), type (enum), title, body, isRead (default false), metadata (JSON), createdAt, updatedAt
- [x] **AC-US1-02**: Given the NotificationType enum, when referenced, then it includes ORDER_STATUS, PAYMENT, COMMISSION, SYSTEM, ADMIN_ALERT, RESELLER
- [x] **AC-US1-03**: Given a Notification record, when queried, then it resolves its associated User via the userId foreign key
- [x] **AC-US1-04**: Given the Notification table, when queried by userId and isRead, then results are returned ordered by createdAt descending with index support

---

## Implementation

**Increment**: [0015-inbox-system](../../../../../increments/0015-inbox-system/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-001**: Prisma Schema — NotificationType Enum and Notification Model
