---
id: US-003
feature: FS-018
title: "Verify build and runtime for both apps (P1)"
status: completed
priority: P1
created: 2026-03-15T00:00:00.000Z
tldr: "**As a** developer."
project: shopvui
---

# US-003: Verify build and runtime for both apps (P1)

**Feature**: [FS-018](./FEATURE.md)

**As a** developer
**I want** both apps to build and start successfully on Next.js 16
**So that** there are no regressions from the upgrade

---

## Acceptance Criteria

- [x] **AC-US3-01**: `turbo build` completes successfully for both `web` and `admin` apps
- [x] **AC-US3-02**: `next dev` starts without errors for both apps
- [x] **AC-US3-03**: PWA service worker (`@serwist/next`) generates correctly in production builds

---

## Implementation

**Increment**: [0018-nextjs-16-upgrade](../../../../../increments/0018-nextjs-16-upgrade/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

_No tasks defined for this user story_
