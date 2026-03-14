---
id: US-004
feature: FS-013
title: "Google OAuth Configuration"
status: not_started
priority: P2
created: 2026-03-14
tldr: "**As a** developer."
project: shopvui
---

# US-004: Google OAuth Configuration

**Feature**: [FS-013](./FEATURE.md)

**As a** developer
**I want** instructions for setting up Google OAuth2 credentials
**So that** I can configure authentication for both the storefront and admin panel

---

## Acceptance Criteria

- [ ] **AC-US4-01**: DEPLOY.md provides step-by-step Google Cloud Console instructions for creating OAuth2 credentials
- [ ] **AC-US4-02**: DEPLOY.md lists the required callback URLs for local dev (localhost:4000/api/auth/google/callback) and production
- [ ] **AC-US4-03**: DEPLOY.md maps OAuth environment variables (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL) to config files

---

## Implementation

**Increment**: [0013-deploy-guide](../../../../../increments/0013-deploy-guide/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-005**: Write Google OAuth Section
