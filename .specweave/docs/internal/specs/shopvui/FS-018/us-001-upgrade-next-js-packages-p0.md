---
id: US-001
feature: FS-018
title: "Upgrade Next.js packages (P0)"
status: completed
priority: P1
created: 2026-03-15T00:00:00.000Z
tldr: "**As a** developer."
project: shopvui
---

# US-001: Upgrade Next.js packages (P0)

**Feature**: [FS-018](./FEATURE.md)

**As a** developer
**I want** both apps upgraded to Next.js 16.x
**So that** we stay on a supported major version with latest improvements

---

## Acceptance Criteria

- [x] **AC-US1-01**: `next` version in `apps/web/package.json` and `apps/admin/package.json` is `^16.1.6`
- [x] **AC-US1-02**: `pnpm install` completes without peer dependency errors related to Next.js
- [x] **AC-US1-03**: `react` and `react-dom` versions are compatible with Next.js 16 requirements

---

## Implementation

**Increment**: [0018-nextjs-16-upgrade](../../../../../increments/0018-nextjs-16-upgrade/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

_No tasks defined for this user story_
