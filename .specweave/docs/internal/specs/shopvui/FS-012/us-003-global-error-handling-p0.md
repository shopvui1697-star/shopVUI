---
id: US-003
feature: FS-012
title: "Global Error Handling (P0)"
status: completed
priority: P0
created: 2026-03-13T00:00:00.000Z
tldr: "**As a** developer."
project: shopvui
---

# US-003: Global Error Handling (P0)

**Feature**: [FS-012](./FEATURE.md)

**As a** developer
**I want** a single global exception filter that standardizes all API error responses
**So that** consumers receive a consistent error format regardless of which endpoint fails

---

## Acceptance Criteria

- [x] **AC-US3-01**: Given a global HttpExceptionFilter is registered in main.ts, when any endpoint throws an HttpException, then the response body matches the shape { statusCode, message, error, timestamp, path }
- [x] **AC-US3-02**: Given an unhandled non-HTTP exception occurs, when the filter catches it, then the response is 500 with the standardized error shape and no internal stack trace is leaked
- [x] **AC-US3-03**: Given process bootstrap, when unhandledRejection or uncaughtException events fire, then they are caught by registered handlers that log the error and do not crash silently

---

## Implementation

**Increment**: [0012-production-hardening](../../../../../increments/0012-production-hardening/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-001**: Create HttpExceptionFilter with standardized error shape
- [x] **T-002**: Verify error shape never leaks stack traces
- [x] **T-003**: Register process-level unhandledRejection and uncaughtException handlers
