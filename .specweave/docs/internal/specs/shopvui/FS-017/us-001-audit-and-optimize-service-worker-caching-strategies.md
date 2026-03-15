---
id: US-001
feature: FS-017
title: "Audit and Optimize Service Worker Caching Strategies"
status: completed
priority: P1
created: 2026-03-15T00:00:00.000Z
tldr: "**As a** user."
project: shopvui
---

# US-001: Audit and Optimize Service Worker Caching Strategies

**Feature**: [FS-017](./FEATURE.md)

**As a** user
**I want** the service worker to use correct caching strategies for each resource type
**So that** I get fast load times without stale critical data

---

## Acceptance Criteria

- [x] **AC-US1-01**: Given the API caching config, when API requests are made, then a NetworkFirst strategy is used with a 10-second timeout fallback to cache
- [x] **AC-US1-02**: Given the precache manifest, when the app is built, then all critical app shell assets are included in the precache list
- [x] **AC-US1-03**: Given cached static assets (fonts, images), when they are requested, then a CacheFirst strategy is used with appropriate max-age expiration
- [x] **AC-US1-04**: Given a new deployment, when the service worker activates, then stale cache entries are purged and the new precache is installed

---

## Implementation

**Increment**: [0017-pwa-optimization](../../../../../increments/0017-pwa-optimization/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-001**: Verify Web App Service Worker Caching Strategies
