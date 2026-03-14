---
id: US-002
feature: FS-013
title: "Local Development Workflow"
status: not_started
priority: P2
created: 2026-03-14
tldr: "**As a** developer."
project: shopvui
---

# US-002: Local Development Workflow

**Feature**: [FS-013](./FEATURE.md)

**As a** developer
**I want** step-by-step instructions for running the monorepo locally
**So that** I can start developing with either pnpm dev or Docker Compose

---

## Acceptance Criteria

- [ ] **AC-US2-01**: DEPLOY.md documents the pnpm-based local dev flow (pnpm install, pnpm dev) with expected ports (web:3000, admin:3001, api:4000)
- [ ] **AC-US2-02**: DEPLOY.md documents the Docker Compose flow (docker compose up) including all four services (postgres, web, admin, api)
- [ ] **AC-US2-03**: DEPLOY.md explains how to run individual apps or packages using Turbo filters (e.g., pnpm turbo dev --filter=api)

---

## Implementation

**Increment**: [0013-deploy-guide](../../../../../increments/0013-deploy-guide/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-003**: Write Local Development Section
