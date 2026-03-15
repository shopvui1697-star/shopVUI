---
id: US-003
feature: FS-016
title: "Customer Review API (P0)"
status: completed
priority: P1
created: 2026-03-15T00:00:00.000Z
tldr: "**As a** customer with a delivered order."
project: shopvui
---

# US-003: Customer Review API (P0)

**Feature**: [FS-016](./FEATURE.md)

**As a** customer with a delivered order
**I want** API endpoints to create, read, update, and delete my product review
**So that** I can share my feedback on purchased products

---

## Acceptance Criteria

- [x] **AC-US3-01**: Given a customer with a DELIVERED order containing productId, when POST `/reviews` with `{ productId, rating, comment }`, then a review is created with status PENDING and 201 is returned
- [x] **AC-US3-02**: Given a customer without a DELIVERED order for productId, when POST `/reviews`, then 403 is returned with message "Purchase verification failed"
- [x] **AC-US3-03**: Given a customer who already reviewed productId, when POST `/reviews` for the same product, then 409 is returned with message "Review already exists"
- [x] **AC-US3-04**: Given a productId, when GET `/reviews?productId={id}`, then only APPROVED reviews are returned with pagination (page, pageSize), each including `helpfulCount` and `userHasVoted` (if authenticated)
- [x] **AC-US3-05**: Given a customer who owns a review, when PATCH `/reviews/:id` with updated rating/comment, then the review is updated, status resets to PENDING, and 200 is returned

---

## Implementation

**Increment**: [0016-product-reviews](../../../../../increments/0016-product-reviews/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-003**: ReviewsModule — Create, List, Update, Delete Endpoints + Purchase Verification
- [x] **T-004**: ReviewsService — Summary Endpoint
