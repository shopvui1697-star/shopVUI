---
id: US-006
feature: FS-017
title: "Admin App PWA Meta Tags"
status: completed
priority: P1
created: 2026-03-15T00:00:00.000Z
tldr: "**As an** admin user."
project: shopvui
---

# US-006: Admin App PWA Meta Tags

**Feature**: [FS-017](./FEATURE.md)

**As an** admin user
**I want** the admin app layout to include all required PWA meta tags
**So that** the app is recognized as installable by browsers and renders correctly in standalone mode

---

## Acceptance Criteria

- [x] **AC-US6-01**: Given the admin layout.tsx, when rendered, then the HTML head includes theme-color meta tag matching the manifest
- [x] **AC-US6-02**: Given the admin layout.tsx, when rendered, then apple-web-app-capable and apple-web-app-status-bar-style meta tags are present
- [x] **AC-US6-03**: Given the admin layout.tsx, when rendered, then an apple-touch-icon link and manifest link are present

---

## Implementation

**Increment**: [0017-pwa-optimization](../../../../../increments/0017-pwa-optimization/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-008**: Add PWA Metadata to Admin Layout
