---
id: US-002
feature: FS-002
title: "API Authentication"
status: completed
priority: P1
created: 2026-03-10
tldr: "**As a** user."
project: shopvui
---

# US-002: API Authentication

**Feature**: [FS-002](./FEATURE.md)

**As a** user
**I want** to sign in with Google via the API
**So that** I can access protected resources

---

## Acceptance Criteria

- [x] **AC-US2-01**: GET /api/auth/google redirects to Google OAuth consent
- [x] **AC-US2-02**: GET /api/auth/google/callback exchanges code for tokens and returns JWT
- [x] **AC-US2-03**: GET /api/auth/me returns current user (requires JWT)
- [x] **AC-US2-04**: POST /api/auth/refresh rotates refresh token
- [x] **AC-US2-05**: AuthGuard blocks unauthenticated API requests
- [x] **AC-US2-06**: JWT access token expires in 15 minutes, refresh token in 7 days

---

## Implementation

**Increment**: [0002-google-oauth](../../../../../increments/0002-google-oauth/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

_No tasks defined for this user story_
