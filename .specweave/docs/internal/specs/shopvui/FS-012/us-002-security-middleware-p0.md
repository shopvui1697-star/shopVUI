---
id: US-002
feature: FS-012
title: "Security Middleware (P0)"
status: completed
priority: P0
created: 2026-03-13T00:00:00.000Z
tldr: "**As a** platform operator."
project: shopvui
---

# US-002: Security Middleware (P0)

**Feature**: [FS-012](./FEATURE.md)

**As a** platform operator
**I want** HTTP security headers and rate limiting on all API endpoints
**So that** the platform is protected against common web attacks and API abuse

---

## Acceptance Criteria

- [x] **AC-US2-01**: Given helmet is installed and configured, when any API response is returned, then it includes CSP, X-Frame-Options, and HSTS headers
- [x] **AC-US2-02**: Given @nestjs/throttler is installed and ThrottlerGuard is registered globally, when a client exceeds 100 requests per minute on general endpoints, then subsequent requests receive 429 Too Many Requests
- [x] **AC-US2-03**: Given auth endpoints have a stricter throttle override, when a client exceeds 5 requests per minute on auth routes, then subsequent requests receive 429 Too Many Requests
- [x] **AC-US2-04**: Given rate limiting is active, when a client stays within the configured limits, then requests are processed normally without throttle interference

---

## Implementation

**Increment**: [0012-production-hardening](../../../../../increments/0012-production-hardening/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-006**: Install helmet and register security headers middleware
- [x] **T-007**: Install @nestjs/throttler and configure rate limiting tiers
