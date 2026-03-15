---
id: US-007
feature: FS-017
title: "Admin App Offline Page"
status: completed
priority: P1
created: 2026-03-15T00:00:00.000Z
tldr: "**As an** admin user."
project: shopvui
---

# US-007: Admin App Offline Page

**Feature**: [FS-017](./FEATURE.md)

**As an** admin user
**I want** a dedicated offline page when I lose connectivity
**So that** I see a helpful message instead of a browser error

---

## Acceptance Criteria

- [x] **AC-US7-01**: Given the admin user is offline, when navigating to any page, then the service worker serves a custom offline fallback page
- [x] **AC-US7-02**: Given the offline page is displayed, when rendered, then it shows the admin app branding, an explanation that the user is offline, and a retry button
- [x] **AC-US7-03**: Given the offline page, when the user clicks retry, then the page attempts to reload and navigates to the requested page if connectivity is restored

---

## Implementation

**Increment**: [0017-pwa-optimization](../../../../../increments/0017-pwa-optimization/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-009**: Create Admin Offline Page
