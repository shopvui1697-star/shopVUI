---
id: US-001
feature: FS-002
title: "Database Setup"
status: completed
priority: P1
created: 2026-03-10
tldr: "**As a** developer."
project: shopvui
---

# US-001: Database Setup

**Feature**: [FS-002](./FEATURE.md)

**As a** developer
**I want** a shared Prisma database package with User model
**So that** all apps can access user data consistently

---

## Acceptance Criteria

- [x] **AC-US1-01**: `packages/db` package exists with Prisma client and schema
- [x] **AC-US1-02**: User model has id, email, name, googleId, avatar, createdAt, updatedAt
- [x] **AC-US1-03**: PostgreSQL service runs via Docker Compose
- [x] **AC-US1-04**: Prisma migrations run successfully

---

## Implementation

**Increment**: [0002-google-oauth](../../../../../increments/0002-google-oauth/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

_No tasks defined for this user story_
