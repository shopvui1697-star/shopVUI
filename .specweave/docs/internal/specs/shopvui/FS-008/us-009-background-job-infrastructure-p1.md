---
id: US-009
feature: FS-008
title: "Background Job Infrastructure (P1)"
status: completed
priority: P1
created: 2026-03-12T00:00:00.000Z
tldr: "**As a** system."
project: shopvui
---

# US-009: Background Job Infrastructure (P1)

**Feature**: [FS-008](./FEATURE.md)

**As a** system
**I want** a cron-based job scheduler for channel sync tasks
**So that** sync jobs run reliably at configured intervals with proper error handling

---

## Acceptance Criteria

- [x] **AC-US9-01**: Given the NestJS application starts, then cron jobs are registered for each enabled channel connection based on their configured interval
- [x] **AC-US9-02**: Given a sync job fails, then it retries up to 3 times with exponential backoff (1s, 2s, 4s) before marking the sync as failed
- [x] **AC-US9-03**: Given a sync job is already running for a shop, when the next interval triggers, then the new run is skipped to prevent concurrent syncs for the same shop
- [x] **AC-US9-04**: Given an admin triggers "Sync Now", then the manual sync runs immediately regardless of the cron schedule (but still respects the concurrency guard)

---

## Implementation

**Increment**: [0008-channel-api-sync](../../../../../increments/0008-channel-api-sync/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-003**: ChannelConnectionService - CRUD Operations
- [x] **T-004**: SyncDispatcher - Cron Polling with Concurrency Guard
- [x] **T-005**: SyncExecutor - Orchestration with Retry and SyncLog
