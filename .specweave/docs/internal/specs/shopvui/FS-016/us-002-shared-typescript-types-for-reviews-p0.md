---
id: US-002
feature: FS-016
title: "Shared TypeScript Types for Reviews (P0)"
status: completed
priority: P1
created: 2026-03-15T00:00:00.000Z
tldr: "**As a** developer."
project: shopvui
---

# US-002: Shared TypeScript Types for Reviews (P0)

**Feature**: [FS-016](./FEATURE.md)

**As a** developer
**I want** shared TypeScript types and enums for the review system in `packages/shared`
**So that** API and frontend apps have consistent type contracts

---

## Acceptance Criteria

- [x] **AC-US2-01**: Given `packages/shared/src/review.ts`, when imported, then `ReviewStatus` enum, `CreateReviewDto`, `UpdateReviewDto`, `ReviewResponse`, `ReviewVoteResponse` types are available
- [x] **AC-US2-02**: Given `packages/shared/src/review.ts`, when imported, then `ReviewListQuery` type is available with optional fields: `productId`, `status`, `page`, `pageSize`, `sortBy` (rating, createdAt, helpfulCount)
- [x] **AC-US2-03**: Given `packages/shared/src/index.ts`, when the shared package is built, then all review types are re-exported

---

## Implementation

**Increment**: [0016-product-reviews](../../../../../increments/0016-product-reviews/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-002**: Shared Types — review.ts + re-export from index.ts
