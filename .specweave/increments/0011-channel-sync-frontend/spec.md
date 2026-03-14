---
increment: 0011-channel-sync-frontend
title: Channel Sync Frontend - Admin Channel Settings UI
status: active
parent: 0008-channel-api-sync
---

# Channel Sync Frontend

## Scope

Admin UI for channel connection management and sync monitoring at `/admin/channels`. Covers T-019 (Channel Settings list view) and T-020 (Sync Logs view + Connect OAuth flow) from the parent increment 0008.

## User Stories Covered

- **US-007**: Admin Channel Management UI (AC-US7-01 through AC-US7-05)
- **US-008**: Sync Logs and Monitoring (AC-US8-01, AC-US8-02) — frontend display only

## Acceptance Criteria

- [x] **AC-US7-01**: /admin/channels shows list of supported channels with connection status
- [x] **AC-US7-02**: Connected channels show shop name, last sync time, sync status, orders synced count
- [x] **AC-US7-03**: "Sync Now" triggers manual sync with loading indicator
- [x] **AC-US7-04**: Toggle switch enables/disables auto-sync
- [x] **AC-US7-05**: Interval dropdown (5/10/15 min) saves and applies
- [x] **AC-US8-01**: Paginated sync log table with timestamp, status, orders fetched/created/updated, duration, error message
- [x] **AC-US8-02**: Failed logs show error type badge and human-readable description

## API Dependencies (Backend)

- `GET /admin/channels` -> `ChannelConnectionDto[]`
- `POST /admin/channels/:id/sync` -> `{ syncLogId }`
- `PATCH /admin/channels/:id` -> `ChannelConnectionDto`
- `DELETE /admin/channels/:id` -> void
- `GET /admin/channels/:id/logs?page=&limit=` -> paginated `SyncLogDto[]`
- `GET /channels/oauth/:channel` -> OAuth redirect
