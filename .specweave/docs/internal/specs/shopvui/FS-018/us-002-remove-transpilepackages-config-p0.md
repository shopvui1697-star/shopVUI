---
id: US-002
feature: FS-018
title: "Remove transpilePackages config (P0)"
status: completed
priority: P1
created: 2026-03-15T00:00:00.000Z
tldr: "**As a** developer."
project: shopvui
---

# US-002: Remove transpilePackages config (P0)

**Feature**: [FS-018](./FEATURE.md)

**As a** developer
**I want** the removed `transpilePackages` option replaced with the v16-compatible approach
**So that** `@shopvui/ui` and `@shopvui/shared` packages are still correctly transpiled

---

## Acceptance Criteria

- [x] **AC-US2-01**: `transpilePackages` is removed from `apps/web/next.config.ts` and `apps/admin/next.config.ts`
- [x] **AC-US2-02**: Internal packages (`@shopvui/ui`, `@shopvui/shared`) are transpiled via the v16 mechanism (e.g., package.json `exports` or bundler resolution)
- [x] **AC-US2-03**: Components imported from `@shopvui/ui` render correctly in both apps

---

## Implementation

**Increment**: [0018-nextjs-16-upgrade](../../../../../increments/0018-nextjs-16-upgrade/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

_No tasks defined for this user story_
