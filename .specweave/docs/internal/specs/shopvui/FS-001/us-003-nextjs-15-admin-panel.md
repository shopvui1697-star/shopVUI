---
id: US-003
feature: FS-001
title: "NextJS 15 Admin Panel"
status: completed
priority: P0
created: 2026-03-10T00:00:00.000Z
tldr: "**As a** developer."
project: shopvui
---

# US-003: NextJS 15 Admin Panel

**Feature**: [FS-001](./FEATURE.md)

**As a** developer
**I want** a NextJS 15 App Router application in `apps/admin`
**So that** I have a runnable admin panel skeleton separate from the storefront

---

## Acceptance Criteria

- [x] **AC-US3-01**: Given `apps/admin`, when I run `pnpm --filter admin dev`, then the Next.js 15 dev server starts on a different port than the web app without errors
- [x] **AC-US3-02**: Given `apps/admin`, when I inspect the project, then it uses the App Router with a root layout and a placeholder dashboard page
- [x] **AC-US3-03**: Given `apps/admin`, when I run `pnpm --filter admin build`, then it compiles with zero TypeScript errors

---

## Implementation

**Increment**: [0001-project-setup](../../../../../increments/0001-project-setup/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

_No tasks defined for this user story_
