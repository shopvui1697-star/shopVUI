---
id: US-001
feature: FS-005
title: "Reseller Registration and Onboarding"
status: completed
priority: P1
created: 2026-03-11T00:00:00.000Z
tldr: "**As a** potential reseller."
project: shopvui
---

# US-001: Reseller Registration and Onboarding

**Feature**: [FS-005](./FEATURE.md)

**As a** potential reseller
**I want** to submit an application with my details
**So that** I can be reviewed and approved to earn commissions

---

## Acceptance Criteria

- [x] **AC-US1-01**: Given I visit /reseller/register, when I submit the form with name, email, phone, social profiles (JSON), and reason, then an application is created with status "pending" and I see a confirmation message
- [x] **AC-US1-02**: Given a pending application exists, when an admin views the reseller management page, then they see the application details and can approve or reject it
- [x] **AC-US1-03**: Given an admin approves my application, when I next visit the site, then my Reseller record status is "active" and I can access the Reseller Portal at /reseller/dashboard
- [x] **AC-US1-04**: Given an admin rejects my application, when I check my status, then I see "rejected" with no portal access
- [x] **AC-US1-05**: Given the Reseller model, then it stores id, userId, name, email, phone, socialProfiles (JSON), status (pending|active|inactive|rejected), bankInfo (JSON), defaultCommissionType, defaultCommissionValue, createdAt, updatedAt

---

## Implementation

**Increment**: [0005-reseller-system](../../../../../increments/0005-reseller-system/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-001**: Prisma Schema - Reseller and Commission Models
- [x] **T-002**: Auth Extension - Local Strategy, Guards, and Reseller Auth Endpoints
- [x] **T-003**: Admin Reseller Approval, Rejection, and Profile Endpoints
