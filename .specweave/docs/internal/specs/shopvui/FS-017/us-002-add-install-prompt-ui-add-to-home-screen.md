---
id: US-002
feature: FS-017
title: "Add Install Prompt UI (Add to Home Screen)"
status: completed
priority: P1
created: 2026-03-15T00:00:00.000Z
tldr: "**As a** user."
project: shopvui
---

# US-002: Add Install Prompt UI (Add to Home Screen)

**Feature**: [FS-017](./FEATURE.md)

**As a** user
**I want** a visible install prompt or button to add the app to my home screen
**So that** I can quickly access the app like a native application

---

## Acceptance Criteria

- [x] **AC-US2-01**: Given the user visits the web app on a supported browser, when the beforeinstallprompt event fires, then an install banner or button is displayed
- [x] **AC-US2-02**: Given the install prompt is shown, when the user dismisses it, then it is not shown again for at least 7 days
- [x] **AC-US2-03**: Given the user clicks the install button, when the browser install dialog appears and is accepted, then the install UI is hidden and the app opens in standalone mode
- [x] **AC-US2-04**: Given the app is already installed, when the user visits the web app, then no install prompt is shown

---

## Implementation

**Increment**: [0017-pwa-optimization](../../../../../increments/0017-pwa-optimization/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-002**: Implement InstallPrompt Component
- [x] **T-003**: Add InstallPrompt to Web App Root Layout
