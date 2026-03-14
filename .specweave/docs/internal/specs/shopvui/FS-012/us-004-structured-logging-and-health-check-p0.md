---
id: US-004
feature: FS-012
title: "Structured Logging and Health Check (P0)"
status: completed
priority: P0
created: 2026-03-13T00:00:00.000Z
tldr: "**As a** platform operator."
project: shopvui
---

# US-004: Structured Logging and Health Check (P0)

**Feature**: [FS-012](./FEATURE.md)

**As a** platform operator
**I want** structured request logging and a database-aware health check
**So that** I can monitor API traffic and detect database connectivity issues before they impact users

---

## Acceptance Criteria

- [x] **AC-US4-01**: Given a request logging middleware is registered in AppModule, when any HTTP request completes, then a structured log entry is emitted containing method, url, status code, and response time in milliseconds
- [x] **AC-US4-02**: Given the existing /api/health endpoint is enhanced, when the database is reachable, then it returns 200 with { status: "ok", database: "connected" } after running Prisma $queryRaw SELECT 1
- [x] **AC-US4-03**: Given the database is unreachable, when /api/health is called, then it returns 503 with { status: "error", database: "disconnected" }

---

## Implementation

**Increment**: [0012-production-hardening](../../../../../increments/0012-production-hardening/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-008**: Create RequestLoggerMiddleware
- [x] **T-009**: Enhance health endpoint with live database connectivity check
