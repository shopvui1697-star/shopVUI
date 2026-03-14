---
id: US-001
feature: FS-013
title: "Prerequisites and Environment Setup"
status: not_started
priority: P2
created: 2026-03-14
tldr: "**As a** new developer."
project: shopvui
---

# US-001: Prerequisites and Environment Setup

**Feature**: [FS-013](./FEATURE.md)

**As a** new developer
**I want** a clear list of prerequisites and environment variable setup instructions
**So that** I can prepare my machine and configure the project without guessing

---

## Acceptance Criteria

- [ ] **AC-US1-01**: DEPLOY.md lists all required tools with minimum versions (Node 20, pnpm 9.15.4, Docker, Docker Compose)
- [ ] **AC-US1-02**: DEPLOY.md documents every environment variable grouped by service (API, Web, Admin) with description, required/optional flag, and example value
- [ ] **AC-US1-03**: DEPLOY.md includes a `.env.example` reference or inline template showing all variables needed to start the project

---

## Implementation

**Increment**: [0013-deploy-guide](../../../../../increments/0013-deploy-guide/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-001**: Write Prerequisites Section
- [x] **T-002**: Write Environment Variables Section
