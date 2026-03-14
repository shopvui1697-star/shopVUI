---
id: US-003
feature: FS-013
title: "Database Migration and Seeding"
status: not_started
priority: P2
created: 2026-03-14
tldr: "**As a** developer."
project: shopvui
---

# US-003: Database Migration and Seeding

**Feature**: [FS-013](./FEATURE.md)

**As a** developer
**I want** database setup instructions covering migration and seeding
**So that** I can initialize and maintain the database schema correctly

---

## Acceptance Criteria

- [ ] **AC-US3-01**: DEPLOY.md documents Prisma migration commands (npx prisma migrate dev, npx prisma migrate deploy) with when to use each
- [ ] **AC-US3-02**: DEPLOY.md documents database seeding (npx prisma db seed) and explains what seed data is created
- [ ] **AC-US3-03**: DEPLOY.md documents how to reset the database (npx prisma migrate reset) and regenerate the Prisma client

---

## Implementation

**Increment**: [0013-deploy-guide](../../../../../increments/0013-deploy-guide/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-004**: Write Database Setup Section
