---
id: US-001
feature: FS-016
title: "Review & Vote Database Models (P0)"
status: completed
priority: P1
created: 2026-03-15T00:00:00.000Z
tldr: "**As a** developer."
project: shopvui
---

# US-001: Review & Vote Database Models (P0)

**Feature**: [FS-016](./FEATURE.md)

**As a** developer
**I want** Prisma models for ProductReview, ReviewVote, and ReviewStatus enum with Product aggregate fields
**So that** the review system has a proper data foundation

---

## Acceptance Criteria

- [x] **AC-US1-01**: Given the Prisma schema, when migrated, then a `ProductReview` model exists with fields: `id`, `userId`, `productId`, `rating` (Int, 1-5), `comment` (String, min 10 / max 1000), `status` (ReviewStatus enum: PENDING, APPROVED, REJECTED), `createdAt`, `updatedAt`
- [x] **AC-US1-02**: Given the Prisma schema, when migrated, then a `ReviewVote` model exists with fields: `id`, `reviewId`, `userId`, `createdAt` representing a "helpful" vote
- [x] **AC-US1-03**: Given the Prisma schema, when migrated, then a unique constraint exists on `(userId, productId)` in ProductReview preventing duplicate reviews
- [x] **AC-US1-04**: Given the Prisma schema, when migrated, then a unique constraint exists on `(userId, reviewId)` in ReviewVote preventing duplicate votes
- [x] **AC-US1-05**: Given the Product model, when migrated, then `avgRating` (Float, nullable) and `reviewCount` (Int, default 0) fields exist as denormalized aggregates

---

## Implementation

**Increment**: [0016-product-reviews](../../../../../increments/0016-product-reviews/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-001**: Prisma Schema — ProductReview, ReviewVote, ReviewStatus, Product Aggregates
