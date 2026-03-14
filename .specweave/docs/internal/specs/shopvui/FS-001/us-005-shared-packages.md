---
id: US-005
feature: FS-001
title: "Shared Packages"
status: completed
priority: P0
created: 2026-03-10T00:00:00.000Z
tldr: "**As a** developer."
project: shopvui
---

# US-005: Shared Packages

**Feature**: [FS-001](./FEATURE.md)

**As a** developer
**I want** shared internal packages for types/utilities and UI components
**So that** common code is reused across apps without duplication

---

## Acceptance Criteria

- [x] **AC-US5-01**: Given `packages/shared`, when I export a TypeScript type and import it in `apps/web`, then the import resolves and typechecks without errors
- [x] **AC-US5-02**: Given `packages/shared`, when I export a utility function, then it is importable and callable from any app in the monorepo
- [x] **AC-US5-03**: Given `packages/ui`, when I export a React component, then it is importable and renderable in both `apps/web` and `apps/admin`
- [x] **AC-US5-04**: Given either shared package, when I run `pnpm turbo build`, then the package builds before its dependent apps

---

## Implementation

**Increment**: [0001-project-setup](../../../../../increments/0001-project-setup/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

_No tasks defined for this user story_
