---
id: FS-017
title: "PWA Review and Optimization"
type: feature
status: completed
priority: P1
created: 2026-03-15T00:00:00.000Z
lastUpdated: 2026-03-15
tldr: "The web app (apps/web) has a functional PWA setup with Serwist service worker, manifest, and offline support, but it has not been audited for caching correctness, install UX, or Lighthouse PWA compliance."
complexity: high
stakeholder_relevant: true
---

# PWA Review and Optimization

## TL;DR

**What**: The web app (apps/web) has a functional PWA setup with Serwist service worker, manifest, and offline support, but it has not been audited for caching correctness, install UX, or Lighthouse PWA compliance.
**Status**: completed | **Priority**: P1
**User Stories**: 7

![PWA Review and Optimization illustration](assets/feature-fs-017.jpg)

## Overview

The web app (apps/web) has a functional PWA setup with Serwist service worker, manifest, and offline support, but it has not been audited for caching correctness, install UX, or Lighthouse PWA compliance. The admin app (apps/admin) has no PWA support at all, meaning admin users cannot use it offline or install it as a standalone app. This increment audits and improves the web app PWA while adding full PWA support to the admin app.

## Implementation History

| Increment | Status | Completion Date |
|-----------|--------|----------------|
| [0017-pwa-optimization](../../../../../increments/0017-pwa-optimization/spec.md) | ✅ completed | 2026-03-15T00:00:00.000Z |

## User Stories

- [US-001: Audit and Optimize Service Worker Caching Strategies](./us-001-audit-and-optimize-service-worker-caching-strategies.md)
- [US-002: Add Install Prompt UI (Add to Home Screen)](./us-002-add-install-prompt-ui-add-to-home-screen.md)
- [US-003: Lighthouse PWA Compliance](./us-003-lighthouse-pwa-compliance.md)
- [US-004: Admin App Manifest and Icons](./us-004-admin-app-manifest-and-icons.md)
- [US-005: Admin App Service Worker with Serwist](./us-005-admin-app-service-worker-with-serwist.md)
- [US-006: Admin App PWA Meta Tags](./us-006-admin-app-pwa-meta-tags.md)
- [US-007: Admin App Offline Page](./us-007-admin-app-offline-page.md)
