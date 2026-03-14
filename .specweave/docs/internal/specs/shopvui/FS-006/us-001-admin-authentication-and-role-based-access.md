---
id: US-001
feature: FS-006
title: "Admin Authentication and Role-Based Access"
status: completed
priority: P0
created: 2026-03-11T00:00:00.000Z
tldr: "**As an** admin."
project: shopvui
---

# US-001: Admin Authentication and Role-Based Access

**Feature**: [FS-006](./FEATURE.md)

**As an** admin
**I want** to log in to the admin dashboard with role-based access control
**So that** only authorized personnel can manage the store

---

## Acceptance Criteria

- [x] **AC-US1-01**: Given a User with role "admin", when they navigate to /admin and authenticate, then they see the admin dashboard home
- [x] **AC-US1-02**: Given a User with role "customer" or "reseller", when they attempt to access /admin, then they are denied access with a 403 response
- [x] **AC-US1-03**: Given an unauthenticated visitor, when they navigate to /admin, then they are redirected to the admin login page
- [x] **AC-US1-04**: Given the User model, when the migration runs, then a "role" field exists with enum values (customer, admin, reseller) defaulting to "customer"

---

## Implementation

**Increment**: [0006-admin-dashboard](../../../../../increments/0006-admin-dashboard/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-001**: Prisma Migration -- UserRole Enum and Order External Fields
- [x] **T-002**: AdminGuard and JWT Role Claim
- [x] **T-003**: Admin App Middleware and Login Flow (Next.js 15)
- [x] **T-004**: Admin Core UI Components and Shared Types
