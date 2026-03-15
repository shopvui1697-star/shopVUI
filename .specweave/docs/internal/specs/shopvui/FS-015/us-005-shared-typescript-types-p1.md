---
id: US-005
feature: FS-015
title: "Shared TypeScript Types (P1)"
status: completed
priority: P1
created: 2026-03-14T00:00:00.000Z
tldr: "**As a** developer."
project: shopvui
---

# US-005: Shared TypeScript Types (P1)

**Feature**: [FS-015](./FEATURE.md)

**As a** developer
**I want** notification-related types exported from @shopvui/shared
**So that** web, admin, and API apps share a single source of truth for notification interfaces

---

## Acceptance Criteria

- [x] **AC-US5-01**: Given @shopvui/shared, when imported, then NotificationType enum, Notification interface, PaginatedNotificationsResponse, and UnreadCountResponse types are available
- [x] **AC-US5-02**: Given the API response shape, when the shared types are used in web and admin apps, then there are zero type mismatches at build time

---

## Implementation

**Increment**: [0015-inbox-system](../../../../../increments/0015-inbox-system/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-002**: Add Notification Types to @shopvui/shared
