---
id: US-006
feature: FS-008
title: "Channel Credentials Security (P1)"
status: completed
priority: P1
created: 2026-03-12T00:00:00.000Z
tldr: "**As a** system."
project: shopvui
---

# US-006: Channel Credentials Security (P1)

**Feature**: [FS-008](./FEATURE.md)

**As a** system
**I want** to store channel API credentials encrypted at rest
**So that** shop access tokens are protected if the database is compromised

---

## Acceptance Criteria

- [x] **AC-US6-01**: Given a ChannelConnection record, then access_token and refresh_token fields are encrypted using AES-256 before database storage
- [x] **AC-US6-02**: Given the encryption key is stored as an environment variable (CHANNEL_ENCRYPTION_KEY), then it is never logged or exposed in API responses
- [x] **AC-US6-03**: Given an admin views Channel Settings, then token values are never sent to the frontend -- only connection status (connected/disconnected) and shop name

---

## Implementation

**Increment**: [0008-channel-api-sync](../../../../../increments/0008-channel-api-sync/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-001**: Prisma Schema - ChannelConnection and SyncLog Models
- [x] **T-002**: CredentialEncryptionService - AES-256-GCM Encrypt/Decrypt
