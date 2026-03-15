---
id: US-004
feature: FS-017
title: "Admin App Manifest and Icons"
status: completed
priority: P1
created: 2026-03-15T00:00:00.000Z
tldr: "**As an** admin user."
project: shopvui
---

# US-004: Admin App Manifest and Icons

**Feature**: [FS-017](./FEATURE.md)

**As an** admin user
**I want** the admin app to have a proper web app manifest with admin-specific branding
**So that** it can be installed as a standalone app with its own identity

---

## Acceptance Criteria

- [x] **AC-US4-01**: Given the admin app, when loaded, then a manifest.json is linked in the HTML head with name "ShopVui Admin", appropriate theme_color, and standalone display mode
- [x] **AC-US4-02**: Given the manifest, when inspected, then it includes icons at 192x192 and 512x512 sizes plus maskable variants
- [x] **AC-US4-03**: Given the admin manifest, when compared to the web manifest, then it uses a distinct theme_color and short_name to differentiate the two apps

---

## Implementation

**Increment**: [0017-pwa-optimization](../../../../../increments/0017-pwa-optimization/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-005**: Create Admin App Manifest and Icon Assets
