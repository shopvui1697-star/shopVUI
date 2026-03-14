---
id: US-005
feature: FS-013
title: "Production Deployment Checklist"
status: not_started
priority: P2
created: 2026-03-14
tldr: "**As a** DevOps engineer."
project: shopvui
---

# US-005: Production Deployment Checklist

**Feature**: [FS-013](./FEATURE.md)

**As a** DevOps engineer
**I want** a production deployment checklist and common commands reference
**So that** I can deploy and operate the application safely in production

---

## Acceptance Criteria

- [ ] **AC-US5-01**: DEPLOY.md includes a pre-deployment checklist covering build verification, env vars, database migration, and CORS/domain configuration
- [ ] **AC-US5-02**: DEPLOY.md provides a common commands reference table (build, dev, test, lint, typecheck, format, Prisma commands)
- [ ] **AC-US5-03**: DEPLOY.md documents production-specific concerns: helmet CSP, JWT secret rotation, DATABASE_URL with SSL, and API docs endpoint (api/docs)

---

## Implementation

**Increment**: [0013-deploy-guide](../../../../../increments/0013-deploy-guide/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-006**: Write Production Deployment Section
