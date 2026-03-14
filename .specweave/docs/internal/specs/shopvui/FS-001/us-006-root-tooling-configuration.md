---
id: US-006
feature: FS-001
title: "Root Tooling Configuration"
status: completed
priority: P0
created: 2026-03-10T00:00:00.000Z
tldr: "**As a** developer."
project: shopvui
---

# US-006: Root Tooling Configuration

**Feature**: [FS-001](./FEATURE.md)

**As a** developer
**I want** shared ESLint, Prettier, and TypeScript base configurations at the monorepo root
**So that** all apps and packages follow consistent code quality standards

---

## Acceptance Criteria

- [x] **AC-US6-01**: Given the monorepo root, when I run `pnpm turbo lint`, then ESLint runs across all apps and packages with zero errors on the scaffolded code
- [x] **AC-US6-02**: Given any app or package, when I inspect its `tsconfig.json`, then it extends a shared base config from the root
- [x] **AC-US6-03**: Given the monorepo root, when I run `pnpm turbo typecheck`, then TypeScript typechecking passes across all workspaces with zero errors
- [x] **AC-US6-04**: Given any source file, when I run Prettier, then it formats consistently using the root `.prettierrc` configuration

---

## Implementation

**Increment**: [0001-project-setup](../../../../../increments/0001-project-setup/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

_No tasks defined for this user story_
