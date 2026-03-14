---
id: US-004
feature: FS-001
title: "NestJS API Service"
status: completed
priority: P0
created: 2026-03-10T00:00:00.000Z
tldr: "**As a** developer."
project: shopvui
---

# US-004: NestJS API Service

**Feature**: [FS-001](./FEATURE.md)

**As a** developer
**I want** a NestJS application in `apps/api` with Swagger documentation
**So that** I have a runnable API skeleton with auto-generated REST docs

---

## Acceptance Criteria

- [x] **AC-US4-01**: Given `apps/api`, when I run `pnpm --filter api start:dev`, then the NestJS server starts and responds to `GET /health` with a 200 status
- [x] **AC-US4-02**: Given `apps/api`, when I navigate to `/api/docs`, then Swagger UI renders the OpenAPI specification
- [x] **AC-US4-03**: Given `apps/api`, when I run `pnpm --filter api build`, then it compiles with zero TypeScript errors
- [x] **AC-US4-04**: Given `apps/api`, when I run `pnpm --filter api test`, then the default health-check test passes

---

## Implementation

**Increment**: [0001-project-setup](../../../../../increments/0001-project-setup/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

_No tasks defined for this user story_
