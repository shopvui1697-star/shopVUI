---
id: US-005
feature: FS-017
title: "Admin App Service Worker with Serwist"
status: completed
priority: P1
created: 2026-03-15T00:00:00.000Z
tldr: "**As an** admin user."
project: shopvui
---

# US-005: Admin App Service Worker with Serwist

**Feature**: [FS-017](./FEATURE.md)

**As an** admin user
**I want** the admin app to cache assets via a service worker
**So that** I get fast repeat loads and basic offline resilience

---

## Acceptance Criteria

- [x] **AC-US5-01**: Given the admin app, when built, then a Serwist-based service worker is generated with precaching of app shell assets
- [x] **AC-US5-02**: Given admin API requests, when made through the service worker, then a NetworkFirst strategy is used (admin data should always be fresh when online)
- [x] **AC-US5-03**: Given static assets (CSS, JS, fonts), when requested, then a CacheFirst strategy with versioned expiration is used
- [x] **AC-US5-04**: Given the admin next.config.ts, when configured, then @serwist/next is integrated and disabled in development mode

---

## Implementation

**Increment**: [0017-pwa-optimization](../../../../../increments/0017-pwa-optimization/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-006**: Install Serwist Dependencies and Configure Admin next.config.ts
- [x] **T-007**: Create Admin App Service Worker
