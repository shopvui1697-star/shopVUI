---
id: US-005
feature: FS-016
title: "Admin Review Moderation API (P0)"
status: completed
priority: P1
created: 2026-03-15T00:00:00.000Z
tldr: "**As an** admin."
project: shopvui
---

# US-005: Admin Review Moderation API (P0)

**Feature**: [FS-016](./FEATURE.md)

**As an** admin
**I want** API endpoints to list, approve, reject, and delete reviews
**So that** I can moderate content quality on the platform

---

## Acceptance Criteria

- [x] **AC-US5-01**: Given an admin, when GET `/admin/reviews` with optional filters (status, productId, userId, page, pageSize), then all reviews matching filters are returned with pagination
- [x] **AC-US5-02**: Given an admin and a PENDING review, when PATCH `/admin/reviews/:id/approve`, then the review status becomes APPROVED and Product aggregate fields (avgRating, reviewCount) are recalculated
- [x] **AC-US5-03**: Given an admin and a PENDING review, when PATCH `/admin/reviews/:id/reject`, then the review status becomes REJECTED and Product aggregates remain unchanged (or recalculated if was previously APPROVED)
- [x] **AC-US5-04**: Given an admin, when DELETE `/admin/reviews/:id`, then the review and its votes are deleted and Product aggregates are recalculated
- [x] **AC-US5-05**: Given a non-admin user, when accessing any `/admin/reviews` endpoint, then 403 is returned

---

## Implementation

**Increment**: [0016-product-reviews](../../../../../increments/0016-product-reviews/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-006**: AdminReviewsModule — List, Approve, Reject, Delete + Aggregate Recalculation
