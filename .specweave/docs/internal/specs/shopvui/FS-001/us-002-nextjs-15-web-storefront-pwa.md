---
id: US-002
feature: FS-001
title: "NextJS 15 Web Storefront (PWA)"
status: completed
priority: P0
created: 2026-03-10T00:00:00.000Z
tldr: "**As a** developer."
project: shopvui
---

# US-002: NextJS 15 Web Storefront (PWA)

**Feature**: [FS-001](./FEATURE.md)

**As a** developer
**I want** a NextJS 15 App Router application in `apps/web` with PWA support
**So that** I have a runnable storefront skeleton that works offline-capable from day one

---

## Acceptance Criteria

- [x] **AC-US2-01**: Given `apps/web`, when I run `pnpm --filter web dev`, then the Next.js 15 dev server starts on a configurable port without errors
- [x] **AC-US2-02**: Given `apps/web`, when I inspect the project, then it uses the App Router (`app/` directory) with a root layout and a placeholder home page
- [x] **AC-US2-03**: Given `apps/web`, when I build and serve the app, then a valid `manifest.json` is served at `/manifest.json` with ShopVui metadata
- [x] **AC-US2-04**: Given `apps/web`, when I inspect `next.config`, then it is configured for PWA with a service worker registration entry point

---

## Implementation

**Increment**: [0001-project-setup](../../../../../increments/0001-project-setup/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

_No tasks defined for this user story_
