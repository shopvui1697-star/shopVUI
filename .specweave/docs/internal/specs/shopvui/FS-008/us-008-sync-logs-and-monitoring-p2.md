---
id: US-008
feature: FS-008
title: "Sync Logs and Monitoring (P2)"
status: completed
priority: P1
created: 2026-03-12T00:00:00.000Z
tldr: "**As an** admin."
project: shopvui
---

# US-008: Sync Logs and Monitoring (P2)

**Feature**: [FS-008](./FEATURE.md)

**As an** admin
**I want** to view sync history and error logs
**So that** I can diagnose sync failures and verify orders are flowing correctly

---

## Acceptance Criteria

- [x] **AC-US8-01**: Given a connected channel, when the admin clicks "View Logs", then they see a paginated list of sync events with: timestamp, status (success/failed), orders fetched, orders created/updated, duration, and error message (if failed)
- [x] **AC-US8-02**: Given a sync failure, then the log entry includes the error type (rate_limit, auth_expired, network_error, mapping_error) and a human-readable description
- [x] **AC-US8-03**: Given sync logs older than 30 days, then they are automatically cleaned up by a scheduled job

---

## Implementation

**Increment**: [0008-channel-api-sync](../../../../../increments/0008-channel-api-sync/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-021**: SyncLog Detail - Structured Error Types and Human-Readable Messages
- [x] **T-022**: SyncLog Cleanup Job - 30-Day Retention
